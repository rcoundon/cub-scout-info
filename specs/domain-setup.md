# Domain Name and SSL Setup Guide

This guide covers setting up a custom domain for the Cub Scout website in production.

## Overview

For production deployment, you'll need:
1. A registered domain name
2. Route 53 DNS configuration
3. SSL/TLS certificate from AWS Certificate Manager

## Option 1: Register a New Domain with AWS

### Step 1: Register Domain in Route 53

```bash
# Check domain availability
aws route53domains check-domain-availability \
  --domain-name your-cubs-site.org.uk \
  --region us-east-1

# Register domain (if available)
# Note: This costs money and can be done via AWS Console for easier payment setup
```

**Via AWS Console (Recommended):**
1. Go to Route 53 → Registered domains
2. Click "Register Domain"
3. Search for your desired domain (e.g., `your-pack-cubs.org.uk`)
4. Complete registration process (usually £10-15/year for .org.uk)

**Recommended domain patterns:**
- `[pack-name]-cubs.org.uk`
- `[pack-number]cubscouts.org.uk`
- `cubs[pack-name].org.uk`

### Step 2: Wait for Registration
- Domain registration typically takes 10-30 minutes
- You'll receive an email when complete
- Route 53 hosted zone is created automatically

## Option 2: Use an Existing Domain

If you already own a domain (registered elsewhere):

### Step 1: Create Route 53 Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name your-cubs-site.org.uk \
  --caller-reference $(date +%s) \
  --profile personal
```

### Step 2: Update Domain Nameservers

1. Get the Route 53 nameservers:
```bash
aws route53 get-hosted-zone --id YOUR_ZONE_ID --profile personal
```

2. Update your domain registrar to use these nameservers:
   - Example nameservers:
     - ns-123.awsdns-12.com
     - ns-456.awsdns-45.net
     - ns-789.awsdns-78.org
     - ns-012.awsdns-01.co.uk

3. Wait for DNS propagation (can take 24-48 hours)

## SSL Certificate Setup

### Step 1: Request Certificate in ACM

**IMPORTANT:** For CloudFront, the certificate MUST be in `us-east-1` region!

```bash
# Request certificate (must be in us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name your-cubs-site.org.uk \
  --subject-alternative-names www.your-cubs-site.org.uk \
  --validation-method DNS \
  --region us-east-1 \
  --profile personal
```

### Step 2: Get Certificate ARN

```bash
aws acm list-certificates --region us-east-1 --profile personal
```

Note the ARN (looks like: `arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID`)

### Step 3: Validate Certificate with DNS

```bash
# Get validation CNAME records
aws acm describe-certificate \
  --certificate-arn YOUR_CERT_ARN \
  --region us-east-1 \
  --profile personal
```

**Add DNS validation records:**

Option A - Manual (via AWS Console):
1. Go to Route 53 → Hosted zones
2. Select your domain
3. Create record:
   - Type: CNAME
   - Name: `_abc123.your-cubs-site.org.uk`
   - Value: `_abc123.acm-validations.aws.`

Option B - Automated:
```bash
# SST can handle this automatically when deploying with a domain
```

### Step 4: Wait for Validation
- Usually takes 5-30 minutes
- Certificate status will change to "Issued"

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn YOUR_CERT_ARN \
  --region us-east-1 \
  --profile personal
```

## Update SST Configuration for Custom Domain

Once you have your domain and certificate, update `sst.config.ts`:

```typescript
export default $config({
  app(input) {
    return {
      name: 'cubs-site',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-2',
          profile: process.env.AWS_PROFILE || 'personal',
        },
      },
    };
  },
  async run() {
    // ... existing code ...

    // Nuxt Frontend with custom domain (production only)
    const site = new sst.aws.Nuxt('CubsSiteFrontend', {
      path: 'frontend',
      domain: $app.stage === 'production'
        ? {
            name: 'your-cubs-site.org.uk',
            aliases: ['www.your-cubs-site.org.uk'],
            dns: sst.aws.dns(),
          }
        : undefined,
      environment: {
        NUXT_PUBLIC_API_URL: api.url,
        NUXT_PUBLIC_USER_POOL_ID: auth.id,
        NUXT_PUBLIC_USER_POOL_CLIENT_ID: auth.client.id,
      },
    });

    return {
      api: api.url,
      site: site.url,
      domain: site.domain,
      userPoolId: auth.id,
      userPoolClientId: auth.client.id,
    };
  },
});
```

## Deployment with Domain

```bash
# Deploy to production with custom domain
pnpm deploy --stage production
```

SST will automatically:
- Create CloudFront distribution
- Attach SSL certificate
- Create Route 53 DNS records
- Configure domain aliases

## Verification

After deployment, verify your site is accessible:

```bash
# Check DNS resolution
dig your-cubs-site.org.uk

# Check HTTPS
curl -I https://your-cubs-site.org.uk

# Check www redirect
curl -I https://www.your-cubs-site.org.uk
```

## Cost Estimates

- **Domain registration**: £10-15/year (.org.uk)
- **Route 53 hosted zone**: £0.50/month
- **SSL Certificate**: Free (AWS Certificate Manager)
- **DNS queries**: ~£0.40/month (1M queries)

## Troubleshooting

### Certificate validation stuck
- Check DNS records are correct
- Wait up to 30 minutes
- Ensure nameservers are propagated

### Domain not resolving
- Check Route 53 records exist
- Verify CloudFront distribution is deployed
- Wait for DNS propagation (up to 48 hours)

### SSL errors
- Ensure certificate is in `us-east-1`
- Check certificate status is "Issued"
- Verify domain names match exactly

## Development vs Production

**Development** (`pnpm dev`):
- No custom domain needed
- Uses CloudFront generated URL
- SSL certificate from AWS (auto-generated)

**Production** (`pnpm deploy --stage production`):
- Custom domain configured
- Your SSL certificate
- Professional URL for parents

## Next Steps

1. ✅ Choose and register domain name
2. ✅ Request SSL certificate in ACM (us-east-1)
3. ✅ Validate certificate via DNS
4. ✅ Update `sst.config.ts` with domain
5. ✅ Deploy to production
6. ✅ Verify site is accessible
7. ✅ Update any documentation/communications with new URL
