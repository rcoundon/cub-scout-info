# Cub Scout Division Website - AWS Deployment Guide

## Prerequisites

### Required Tools
- AWS CLI (v2.x)
- Node.js (v20.x or later)
- npm or yarn
- Git
- AWS CDK CLI or Terraform (for Infrastructure as Code)
- PostgreSQL client (for database operations)

### AWS Account Requirements
- Active AWS account
- IAM user with appropriate permissions
- Billing alerts configured
- MFA enabled (recommended)

### Required AWS Permissions
- S3 (create buckets, upload objects)
- CloudFront (create distributions)
- Lambda (create functions, manage layers)
- API Gateway (create APIs, deploy stages)
- RDS/Aurora (create databases)
- Cognito (create user pools)
- Route 53 (manage DNS records)
- Certificate Manager (request certificates)
- CloudWatch (create logs, metrics, alarms)
- Secrets Manager (create secrets)
- IAM (create roles and policies)

## Initial AWS Setup

### 1. Configure AWS CLI

```bash
# Install AWS CLI (if not installed)
# macOS
brew install awscli

# Windows
# Download from https://aws.amazon.com/cli/

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., eu-west-2 for London)
# - Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

### 2. Set Up Domain and SSL Certificate

```bash
# If you don't have a domain, register one in Route 53
aws route53domains register-domain --domain-name your-cubs-site.org.uk

# Request SSL certificate in Certificate Manager
# Note: Certificate for CloudFront MUST be in us-east-1
aws acm request-certificate \
  --domain-name your-cubs-site.org.uk \
  --subject-alternative-names www.your-cubs-site.org.uk \
  --validation-method DNS \
  --region us-east-1

# List certificates to get ARN
aws acm list-certificates --region us-east-1

# Add DNS validation records to Route 53
# (This is typically done via console or automated with CDK/Terraform)
```

## Infrastructure as Code Deployment

### Option A: Using AWS CDK (Recommended)

#### 1. Install AWS CDK

```bash
npm install -g aws-cdk

# Verify installation
cdk --version
```

#### 2. Initialize CDK Project

```bash
mkdir cubs-site-infrastructure
cd cubs-site-infrastructure

# Initialize CDK project
cdk init app --language=typescript

# Install required CDK libraries
npm install @aws-cdk/aws-s3 \
  @aws-cdk/aws-cloudfront \
  @aws-cdk/aws-lambda \
  @aws-cdk/aws-apigateway \
  @aws-cdk/aws-rds \
  @aws-cdk/aws-cognito \
  @aws-cdk/aws-route53 \
  @aws-cdk/aws-certificatemanager \
  @aws-cdk/aws-secretsmanager
```

#### 3. Create CDK Stack (Example)

Create `lib/cubs-site-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class CubsSiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for frontend
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 bucket for file uploads
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // CloudFront distribution
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      'arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID'
    );

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ['your-cubs-site.org.uk', 'www.your-cubs-site.org.uk'],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Aurora Serverless database
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const database = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      defaultDatabaseName: 'cubssite',
      credentials: rds.Credentials.fromSecret(dbSecret),
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const userPoolClient = userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // Lambda function for API
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('path/to/lambda/code'),
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        UPLOADS_BUCKET: uploadsBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
    });

    dbSecret.grantRead(apiFunction);
    uploadsBucket.grantReadWrite(apiFunction);
    database.grantDataApiAccess(apiFunction);

    // API Gateway
    const api = new apigateway.LambdaRestApi(this, 'Api', {
      handler: apiFunction,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Route 53 records
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'your-cubs-site.org.uk',
    });

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
  }
}
```

#### 4. Deploy with CDK

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT_ID/REGION

# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy

# For production, use explicit environment
cdk deploy --context env=production
```

### Option B: Using Terraform

#### 1. Create Terraform Configuration

Create `main.tf`:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "cubs-site-terraform-state"
    key    = "terraform.tfstate"
    region = "eu-west-2"
  }
}

provider "aws" {
  region = "eu-west-2"
}

# S3 bucket for frontend
resource "aws_s3_bucket" "website" {
  bucket = "cubs-site-frontend"
}

# ... (additional resources)
```

#### 2. Deploy with Terraform

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply deployment
terraform apply tfplan

# View outputs
terraform output
```

## Manual Deployment Steps (Alternative)

If not using IaC, follow these steps:

### 1. Create S3 Buckets

```bash
# Frontend bucket
aws s3 mb s3://cubs-site-frontend-UNIQUE_ID

# Uploads bucket
aws s3 mb s3://cubs-site-uploads-UNIQUE_ID

# Enable versioning on uploads bucket
aws s3api put-bucket-versioning \
  --bucket cubs-site-uploads-UNIQUE_ID \
  --versioning-configuration Status=Enabled
```

### 2. Create DynamoDB Table

```bash
# Create DynamoDB table with on-demand capacity
aws dynamodb create-table \
  --table-name cubs-site-data \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"GSI1\",
        \"KeySchema\": [
          {\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"GSI2\",
        \"KeySchema\": [
          {\"AttributeName\":\"GSI2PK\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"GSI2SK\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      }
    ]" \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name cubs-site-data \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Enable encryption (enabled by default with AWS owned key)
```

### 3. Create Cognito User Pool

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name cubs-site-users \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies "PasswordPolicy={MinimumLength=12,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}"

# Create user pool client
aws cognito-idp create-user-pool-client \
  --user-pool-id eu-west-2_XXXXX \
  --client-name cubs-site-web \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

### 4. Create Lambda Function

```bash
# Package Lambda function
cd backend
npm install --production
zip -r function.zip .

# Create Lambda function
aws lambda create-function \
  --function-name cubs-site-api \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables={DB_HOST=xxx,DB_NAME=cubssite,USER_POOL_ID=xxx}
```

### 5. Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
  --name cubs-site-api \
  --description "Cubs Site API"

# Configure API Gateway (multiple steps - easier via console or IaC)
```

### 6. Create CloudFront Distribution

```bash
# Create CloudFront distribution (complex - use AWS Console or IaC)
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

## DynamoDB Data Setup

### 1. Verify Table Creation

```bash
# Describe table
aws dynamodb describe-table --table-name cubs-site-data

# Check table status
aws dynamodb describe-table \
  --table-name cubs-site-data \
  --query 'Table.TableStatus' \
  --output text
```

### 2. Seed Initial Data

Create a seed script (e.g., `scripts/seed-data.js`):

```javascript
// scripts/seed-data.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'eu-west-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function seedData() {
  // This will be populated after admin user is created in Cognito
  console.log('Seed data ready. Create admin user in Cognito first.');
}

seedData();
```

### 3. Create Initial Admin User

```bash
# Create initial admin user in Cognito
aws cognito-idp admin-create-user \
  --user-pool-id eu-west-2_XXXXX \
  --username admin@your-cubs-site.org.uk \
  --user-attributes Name=email,Value=admin@your-cubs-site.org.uk Name=email_verified,Value=true \
  --temporary-password TempPassword123!

# Get Cognito user ID
COGNITO_ID=$(aws cognito-idp admin-get-user \
  --user-pool-id eu-west-2_XXXXX \
  --username admin@your-cubs-site.org.uk \
  --query 'Username' --output text)

# Insert admin user in DynamoDB
aws dynamodb put-item \
  --table-name cubs-site-data \
  --item "{
    \"PK\": {\"S\": \"USER#${COGNITO_ID}\"},
    \"SK\": {\"S\": \"METADATA\"},
    \"email\": {\"S\": \"admin@your-cubs-site.org.uk\"},
    \"role\": {\"S\": \"admin\"},
    \"first_name\": {\"S\": \"Admin\"},
    \"last_name\": {\"S\": \"User\"},
    \"created_at\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
    \"GSI1PK\": {\"S\": \"EMAIL#admin@your-cubs-site.org.uk\"},
    \"GSI1SK\": {\"S\": \"USER#${COGNITO_ID}\"}
  }"
```

## Application Deployment

### 1. Build Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file for production
cat > .env << EOF
NUXT_PUBLIC_API_URL=https://api.your-cubs-site.org.uk
NUXT_PUBLIC_USER_POOL_ID=eu-west-2_XXXXX
NUXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxx
EOF

# Build for production (static site generation)
npm run generate

# This creates .output/public/ directory with static files
```

### 2. Deploy Frontend to S3

```bash
# Sync files to S3 (Nuxt outputs to .output/public/)
aws s3 sync .output/public/ s3://cubs-site-frontend-UNIQUE_ID/ --delete

# Set cache headers for assets
aws s3 cp s3://cubs-site-frontend-UNIQUE_ID/_nuxt/ \
  s3://cubs-site-frontend-UNIQUE_ID/_nuxt/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable"

# Set cache headers for HTML (no caching)
aws s3 cp s3://cubs-site-frontend-UNIQUE_ID/ \
  s3://cubs-site-frontend-UNIQUE_ID/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "no-cache" \
  --exclude "_nuxt/*" \
  --exclude "*.json" \
  --include "*.html"
```

### 3. Deploy Backend to Lambda

```bash
cd backend

# Install dependencies
npm install --production

# Package code
zip -r function.zip .

# Update Lambda function
aws lambda update-function-code \
  --function-name cubs-site-api \
  --zip-file fileb://function.zip
```

### 4. Invalidate CloudFront Cache

```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/*"
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build
        working-directory: frontend
        env:
          NUXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NUXT_PUBLIC_USER_POOL_ID: ${{ secrets.USER_POOL_ID }}
          NUXT_PUBLIC_USER_POOL_CLIENT_ID: ${{ secrets.USER_POOL_CLIENT_ID }}
        run: npm run generate

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-2

      - name: Deploy to S3
        run: |
          aws s3 sync frontend/.output/public s3://${{ secrets.S3_BUCKET }}/ --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: backend
        run: npm ci --production

      - name: Package Lambda
        working-directory: backend
        run: zip -r ../function.zip .

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-2

      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code \
            --function-name cubs-site-api \
            --zip-file fileb://function.zip
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Test API endpoint
curl https://api.your-cubs-site.org.uk/health

# Test frontend
curl https://your-cubs-site.org.uk

# Check Lambda logs
aws logs tail /aws/lambda/cubs-site-api --follow

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=cubs-site-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

### 2. Smoke Tests

```bash
# Test event listing
curl https://api.your-cubs-site.org.uk/api/events

# Test authentication (should return 401)
curl https://api.your-cubs-site.org.uk/api/admin/events

# Test login
curl -X POST https://api.your-cubs-site.org.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@your-cubs-site.org.uk","password":"password"}'
```

## Monitoring and Maintenance

### Set Up CloudWatch Alarms

```bash
# API error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cubs-site-api-errors \
  --alarm-description "Alert on high error rate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=cubs-site-api

# Database CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cubs-site-db-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBClusterIdentifier,Value=cubs-site-db
```

### Backup Configuration

```bash
# Point-in-time recovery is already enabled during table creation
# Verify PITR status
aws dynamodb describe-continuous-backups --table-name cubs-site-data

# Create on-demand backup
aws dynamodb create-backup \
  --table-name cubs-site-data \
  --backup-name cubs-site-backup-$(date +%Y%m%d)

# List all backups
aws dynamodb list-backups --table-name cubs-site-data
```

## Cost Optimization

### Estimated Monthly Costs (UK Region)
- **DynamoDB**: £2-10 (on-demand pricing, very low for small traffic)
  - First 25 GB storage free
  - First 2.5M read requests free per month
  - On-demand pricing scales with usage
- **Lambda**: £0-5 (under free tier for low traffic)
- **S3**: £1-5
- **CloudFront**: £5-20
- **Route 53**: £0.50 per hosted zone
- **Cognito**: Free (up to 50K monthly active users)
- **Data Transfer**: £5-15
- **Total**: £15-60/month (significantly lower with DynamoDB)

### Cost Reduction Tips
1. Use DynamoDB on-demand mode (no need to provision capacity)
2. Enable CloudFront caching to reduce API Gateway and Lambda invocations
3. Use S3 lifecycle policies for old file versions
4. Set Lambda memory appropriately (512MB should be sufficient)
5. Monitor DynamoDB costs - switch to provisioned mode if usage becomes predictable
6. Use CloudWatch to track and optimize Lambda execution times
7. Consider DynamoDB reserved capacity if you reach sustained high usage (unlikely for this scale)

## Troubleshooting

### Common Issues

**Issue: CloudFront returns 403**
- Check S3 bucket policy allows CloudFront OAI
- Verify CloudFront origin settings

**Issue: Lambda timeout**
- Increase Lambda timeout setting
- Check DynamoDB query efficiency (use Query instead of Scan)
- Review Lambda execution logs in CloudWatch

**Issue: CORS errors**
- Verify API Gateway CORS configuration
- Check CloudFront headers

**Issue: DynamoDB throttling**
- Check CloudWatch for throttling metrics
- Consider switching to provisioned capacity if on-demand
- Review access patterns and optimize queries
- Add exponential backoff in application code

**Issue: DynamoDB item not found**
- Verify PK/SK structure matches schema design
- Check GSI configuration for query operations
- Ensure data was written with correct key format

## Rollback Procedures

### Frontend Rollback
```bash
# List previous S3 versions
aws s3api list-object-versions --bucket cubs-site-frontend-UNIQUE_ID

# Restore previous version (manual process)
# Or redeploy previous Git tag
```

### Backend Rollback
```bash
# List previous Lambda versions
aws lambda list-versions-by-function --function-name cubs-site-api

# Update alias to previous version
aws lambda update-alias \
  --function-name cubs-site-api \
  --name production \
  --function-version $PREVIOUS_VERSION
```

### DynamoDB Rollback

**Option 1: Restore from on-demand backup**
```bash
# List available backups
aws dynamodb list-backups --table-name cubs-site-data

# Restore from backup to a new table
aws dynamodb restore-table-from-backup \
  --target-table-name cubs-site-data-restored \
  --backup-arn arn:aws:dynamodb:eu-west-2:ACCOUNT_ID:table/cubs-site-data/backup/BACKUP_ID

# Once verified, you can rename tables or update application to use restored table
```

**Option 2: Restore using point-in-time recovery**
```bash
# Restore to specific point in time (within last 35 days)
aws dynamodb restore-table-to-point-in-time \
  --source-table-name cubs-site-data \
  --target-table-name cubs-site-data-restored \
  --restore-date-time 2024-01-15T10:00:00Z

# Or restore to latest restorable time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name cubs-site-data \
  --target-table-name cubs-site-data-restored \
  --use-latest-restorable-time
```

## Security Best Practices

1. Enable MFA for AWS root account
2. Use IAM roles instead of access keys where possible
3. Enable CloudTrail for audit logging
4. Regularly rotate database credentials
5. Enable AWS GuardDuty for threat detection
6. Keep all dependencies updated
7. Regular security audits
8. Enable AWS Config for compliance monitoring

## Support and Resources

- AWS Documentation: https://docs.aws.amazon.com
- AWS Support: https://console.aws.amazon.com/support
- Community: AWS Forums, Stack Overflow
- Cost Calculator: https://calculator.aws
