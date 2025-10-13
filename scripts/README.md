# Deployment Scripts

This directory contains helper scripts for deploying and managing the Cubs Site infrastructure.

## setup-dns.sh

Sets up Route53 DNS records to point your custom domain to the CloudFront distribution.

### Prerequisites

- AWS CLI installed and configured
- Route53 hosted zone created for your domain
- SST deployed to production stage
- AWS profile 'scouts' configured (or set AWS_PROFILE environment variable)

### Usage

1. Deploy your application to production:
   ```bash
   sst deploy --stage production
   ```

2. Note the CloudFront distribution domain from the SST output (looks like `d1234567890abc.cloudfront.net`)

3. Run the DNS setup script:
   ```bash
   ./scripts/setup-dns.sh
   ```

4. When prompted, enter the CloudFront domain name

The script will create:
- An A record for `1stholmergreenscouts.org.uk` pointing to CloudFront
- An A record for `www.1stholmergreenscouts.org.uk` pointing to CloudFront

### Manual Setup

If you prefer to set up DNS manually:

1. Go to AWS Route53 console
2. Select your hosted zone for `1stholmergreenscouts.org.uk`
3. Create an A record (Alias):
   - Name: (leave blank for root domain)
   - Type: A
   - Alias: Yes
   - Alias Target: Select your CloudFront distribution
4. Create another A record for `www`:
   - Name: www
   - Type: A
   - Alias: Yes
   - Alias Target: Select your CloudFront distribution

### Verification

After setup, verify DNS propagation:

```bash
# Check DNS records
dig 1stholmergreenscouts.org.uk
dig www.1stholmergreenscouts.org.uk

# Or use nslookup
nslookup 1stholmergreenscouts.org.uk
nslookup www.1stholmergreenscouts.org.uk
```

DNS changes can take a few minutes to propagate.

### Troubleshooting

**Error: No hosted zone found**
- Create a hosted zone first:
  ```bash
  aws route53 create-hosted-zone \
    --name 1stholmergreenscouts.org.uk \
    --caller-reference $(date +%s) \
    --profile scouts
  ```

**Error: Could not find CloudFront distribution**
- Make sure you entered the correct CloudFront domain
- Verify the distribution exists in CloudFront console
- Check you're using the correct AWS profile

**DNS not resolving**
- Wait a few minutes for DNS propagation
- Clear your DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Check CloudFront distribution is deployed
- Verify certificate is validated in ACM
