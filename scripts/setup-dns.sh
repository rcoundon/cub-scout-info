#!/bin/bash

# Script to set up Route53 DNS records for the Cubs Site
# Run this after deploying to production with SST

set -e

# Configuration
DOMAIN="1stholmergreenscouts.org.uk"
AWS_PROFILE="${AWS_PROFILE:-scouts}"
AWS_REGION="${AWS_REGION:-eu-west-2}"

echo "================================"
echo "Cubs Site - DNS Setup Script"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Check if hosted zone exists
echo "Looking for Route53 hosted zone for ${DOMAIN}..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
    --output text \
    --profile "${AWS_PROFILE}" | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "Error: No hosted zone found for ${DOMAIN}"
    echo "Please create a hosted zone first:"
    echo "  aws route53 create-hosted-zone --name ${DOMAIN} --caller-reference $(date +%s) --profile ${AWS_PROFILE}"
    exit 1
fi

echo "Found hosted zone: ${HOSTED_ZONE_ID}"
echo ""

# Get CloudFront distribution domain from SST output
echo "Please provide the CloudFront distribution domain name from SST output:"
echo "(It should look like: d1234567890abc.cloudfront.net)"
read -p "CloudFront domain: " CLOUDFRONT_DOMAIN

if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    echo "Error: CloudFront domain is required"
    exit 1
fi

# Get CloudFront distribution ID
echo ""
echo "Getting CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='${CLOUDFRONT_DOMAIN}'].Id" \
    --output text \
    --profile "${AWS_PROFILE}")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Error: Could not find CloudFront distribution"
    exit 1
fi

HOSTED_ZONE_ID_CLOUDFRONT="Z2FDTNDATAQYW2"  # CloudFront hosted zone ID (constant for all CloudFront distributions)

echo "Found distribution ID: ${DISTRIBUTION_ID}"
echo ""

# Create DNS records
echo "Creating DNS records..."

# Create A record for root domain
cat > /tmp/dns-change-root.json <<EOF
{
  "Comment": "Create A record for ${DOMAIN}",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN}",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "${HOSTED_ZONE_ID_CLOUDFRONT}",
        "DNSName": "${CLOUDFRONT_DOMAIN}",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --change-batch file:///tmp/dns-change-root.json \
    --profile "${AWS_PROFILE}"

echo "✓ Created A record for ${DOMAIN}"

# Create A record for www subdomain
cat > /tmp/dns-change-www.json <<EOF
{
  "Comment": "Create A record for www.${DOMAIN}",
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "www.${DOMAIN}",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "${HOSTED_ZONE_ID_CLOUDFRONT}",
        "DNSName": "${CLOUDFRONT_DOMAIN}",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --change-batch file:///tmp/dns-change-www.json \
    --profile "${AWS_PROFILE}"

echo "✓ Created A record for www.${DOMAIN}"

# Cleanup
rm /tmp/dns-change-root.json /tmp/dns-change-www.json

echo ""
echo "================================"
echo "DNS Setup Complete!"
echo "================================"
echo ""
echo "DNS records have been created. It may take a few minutes to propagate."
echo ""
echo "You can verify the setup with:"
echo "  dig ${DOMAIN}"
echo "  dig www.${DOMAIN}"
echo ""
echo "Or test in your browser:"
echo "  https://${DOMAIN}"
echo "  https://www.${DOMAIN}"
echo ""
