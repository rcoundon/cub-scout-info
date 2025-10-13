#!/bin/bash

# Script to validate ACM certificate by adding DNS records to Route53

set -e

# Configuration
DOMAIN="1stholmergreenscouts.org.uk"
AWS_PROFILE="${AWS_PROFILE:-scouts}"
CERT_ARN="${ACM_CERTIFICATE_ARN:-arn:aws:acm:us-east-1:634384016985:certificate/19d50073-7d12-4baf-baa3-3d7a8903ad49}"

echo "================================"
echo "ACM Certificate Validation"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Get hosted zone ID
echo "Looking for Route53 hosted zone for ${DOMAIN}..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
    --output text \
    --profile "${AWS_PROFILE}" | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "Error: No hosted zone found for ${DOMAIN}"
    echo ""
    echo "Create a hosted zone first:"
    echo "  aws route53 create-hosted-zone --name ${DOMAIN} --caller-reference \$(date +%s) --profile ${AWS_PROFILE}"
    exit 1
fi

echo "Found hosted zone: ${HOSTED_ZONE_ID}"
echo ""

# Get certificate validation records
echo "Getting certificate validation records..."
CERT_INFO=$(aws acm describe-certificate \
    --certificate-arn "${CERT_ARN}" \
    --region us-east-1 \
    --profile "${AWS_PROFILE}")

CERT_STATUS=$(echo "$CERT_INFO" | jq -r '.Certificate.Status')

if [ "$CERT_STATUS" = "ISSUED" ]; then
    echo "✓ Certificate is already validated and issued!"
    echo ""
    echo "You can now proceed with deployment:"
    echo "  sst deploy --stage production"
    exit 0
fi

if [ "$CERT_STATUS" != "PENDING_VALIDATION" ]; then
    echo "Error: Certificate status is ${CERT_STATUS}"
    echo "Expected PENDING_VALIDATION or ISSUED"
    exit 1
fi

echo "Certificate status: PENDING_VALIDATION"
echo "Adding DNS validation records to Route53..."
echo ""

# Extract validation records and create Route53 change batch
VALIDATION_RECORDS=$(echo "$CERT_INFO" | jq -r '.Certificate.DomainValidationOptions[] | @json')

# Create a change batch with all validation records
cat > /tmp/acm-validation-changes.json <<EOF
{
  "Comment": "ACM certificate validation records",
  "Changes": [
EOF

FIRST=true
while IFS= read -r record; do
    NAME=$(echo "$record" | jq -r '.ResourceRecord.Name')
    VALUE=$(echo "$record" | jq -r '.ResourceRecord.Value')
    DOMAIN_NAME=$(echo "$record" | jq -r '.DomainName')

    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "    ," >> /tmp/acm-validation-changes.json
    fi

    echo "  Adding validation record for: ${DOMAIN_NAME}"

    cat >> /tmp/acm-validation-changes.json <<EOF
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${NAME}",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "${VALUE}"
          }
        ]
      }
    }
EOF
done <<< "$VALIDATION_RECORDS"

cat >> /tmp/acm-validation-changes.json <<EOF

  ]
}
EOF

# Apply the changes
aws route53 change-resource-record-sets \
    --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --change-batch file:///tmp/acm-validation-changes.json \
    --profile "${AWS_PROFILE}" > /dev/null

rm /tmp/acm-validation-changes.json

echo ""
echo "✓ DNS validation records added to Route53"
echo ""
echo "================================"
echo "Waiting for Certificate Validation"
echo "================================"
echo ""
echo "AWS will now validate the certificate. This typically takes 5-30 minutes."
echo ""
echo "Checking status every 30 seconds..."
echo "(Press Ctrl+C to stop checking and check manually later)"
echo ""

# Wait for certificate validation
ATTEMPTS=0
MAX_ATTEMPTS=60  # 30 minutes

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    sleep 30
    ATTEMPTS=$((ATTEMPTS + 1))

    CURRENT_STATUS=$(aws acm describe-certificate \
        --certificate-arn "${CERT_ARN}" \
        --region us-east-1 \
        --profile "${AWS_PROFILE}" \
        --query 'Certificate.Status' \
        --output text)

    echo "[$(date +%H:%M:%S)] Status: ${CURRENT_STATUS} (attempt ${ATTEMPTS}/${MAX_ATTEMPTS})"

    if [ "$CURRENT_STATUS" = "ISSUED" ]; then
        echo ""
        echo "================================"
        echo "✓ Certificate Validated Successfully!"
        echo "================================"
        echo ""
        echo "You can now deploy to production:"
        echo "  sst deploy --stage production"
        echo ""
        exit 0
    fi

    if [ "$CURRENT_STATUS" != "PENDING_VALIDATION" ]; then
        echo ""
        echo "Error: Certificate status changed to ${CURRENT_STATUS}"
        exit 1
    fi
done

echo ""
echo "Validation is taking longer than expected (30+ minutes)."
echo "You can check the status manually with:"
echo "  aws acm describe-certificate --certificate-arn ${CERT_ARN} --region us-east-1 --profile ${AWS_PROFILE}"
echo ""
echo "Once status is 'ISSUED', run:"
echo "  sst deploy --stage production"
