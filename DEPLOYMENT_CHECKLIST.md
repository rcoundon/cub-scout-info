# Production Deployment Checklist

Quick reference for deploying Cubs Site to production on AWS.

## Pre-Deployment Setup (One-Time)

- [ ] AWS account created for production
- [ ] AWS CLI configured with 'scouts' profile
- [ ] Domain registered (1stholmergreenscouts.org.uk)
- [ ] Route53 hosted zone created
- [ ] ACM certificate requested in us-east-1
- [ ] ACM certificate validated via DNS
- [ ] Certificate ARN added to .env file
- [ ] pnpm installed globally
- [ ] Project dependencies installed (`pnpm install`)

## Environment Configuration

Update `.env` file:

```bash
AWS_REGION=eu-west-2
AWS_PROFILE=scouts
ORGANIZATION_NAME=1st Holmer Green Scout Group
ACM_CERTIFICATE_ARN=arn:aws:acm:us-east-1:634384016985:certificate/19d50073-7d12-4baf-baa3-3d7a8903ad49
SST_STAGE=production
```

## Deployment Steps

### 1. Verify Certificate Status

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:634384016985:certificate/19d50073-7d12-4baf-baa3-3d7a8903ad49 \
  --region us-east-1 \
  --profile scouts \
  --query 'Certificate.Status'
```

Should return: `"ISSUED"`

### 2. Deploy Infrastructure

```bash
# Deploy to production
sst deploy --stage production
```

**Note:** Save the output! You'll need:
- CloudFront distribution domain (e.g., d1234567890abc.cloudfront.net)
- User Pool ID
- User Pool Client ID
- API URL

### 3. Configure DNS

```bash
# Run the automated DNS setup script
./scripts/setup-dns.sh

# When prompted, enter the CloudFront domain from step 2
```

**Or manually:**
- Go to Route53 console
- Select hosted zone: 1stholmergreenscouts.org.uk
- Create A record (Alias) for root domain → CloudFront distribution
- Create A record (Alias) for www subdomain → CloudFront distribution

### 4. Create Admin User

```bash
# Replace USER_POOL_ID with the value from step 2
aws cognito-idp admin-create-user \
  --user-pool-id USER_POOL_ID \
  --username admin@1stholmergreenscouts.org.uk \
  --user-attributes \
    Name=email,Value=admin@1stholmergreenscouts.org.uk \
    Name=email_verified,Value=true \
  --profile scouts
```

### 5. Verify Deployment

```bash
# Test DNS resolution
dig 1stholmergreenscouts.org.uk
dig www.1stholmergreenscouts.org.uk

# Test HTTPS
curl -I https://1stholmergreenscouts.org.uk
curl -I https://www.1stholmergreenscouts.org.uk

# Verify certificate
openssl s_client -connect 1stholmergreenscouts.org.uk:443 -servername 1stholmergreenscouts.org.uk < /dev/null
```

### 6. First Login

- [ ] Navigate to https://1stholmergreenscouts.org.uk/login
- [ ] Log in with admin email (temporary password sent via email)
- [ ] Change password when prompted
- [ ] Verify admin access to dashboard

## Post-Deployment Tasks

- [ ] Invite additional users via admin panel
- [ ] Test file upload functionality
- [ ] Configure email sender in SES (if needed)
- [ ] Set up CloudWatch alarms (optional)
- [ ] Enable AWS Backup for DynamoDB (optional)
- [ ] Document User Pool ID and other resources in team docs

## Updating Production

When you need to deploy changes:

```bash
# 1. Commit and push changes to git
git add .
git commit -m "Description of changes"
git push

# 2. Deploy to production
sst deploy --stage production

# SST automatically:
# - Updates Lambda functions
# - Rebuilds and deploys frontend
# - Invalidates CloudFront cache
```

## Rollback

If deployment has issues:

```bash
# Rollback to previous git commit
git log --oneline  # Find previous commit hash
git checkout PREVIOUS_COMMIT_HASH
sst deploy --stage production

# Or use AWS Console to rollback Lambda versions
```

## Troubleshooting

**DNS not resolving:**
- Wait 5-10 minutes for propagation
- Check Route53 records are correct
- Verify CloudFront distribution is deployed

**Certificate errors:**
- Verify certificate is in us-east-1 (not eu-west-2)
- Check certificate includes both root and www domains
- Ensure certificate status is "ISSUED"

**403 Forbidden errors:**
- Check CloudFront distribution settings
- Verify S3 bucket permissions
- Check CloudFront origin configuration

**Admin can't log in:**
- Verify Cognito user was created
- Check email was sent (check spam folder)
- Ensure User Pool ID matches deployed resources

## Important Commands

```bash
# View SST outputs
sst shell --stage production
console.log($app)

# View CloudWatch logs
aws logs tail /aws/lambda/cubs-site-api --follow --profile scouts

# List SST resources
sst list --stage production

# Remove stage (CAREFUL!)
sst remove --stage production
```

## Support

- SST Documentation: https://sst.dev/docs
- AWS Console: https://console.aws.amazon.com
- Project Docs: specs/deployment.md
- Scripts Help: scripts/README.md
