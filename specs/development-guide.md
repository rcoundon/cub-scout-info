# Development Guide

This guide covers the development workflow for the Cubs Site project.

## Quick Start

```bash
# Start SST development environment (from project root)
pnpm dev
```

This single command:
- Deploys AWS resources (DynamoDB, S3, Cognito, Lambda) to your dev stage
- Starts the Nuxt dev server on http://localhost:3000
- Enables hot reload for both frontend and backend code
- Connects local code to live AWS resources

## Development URLs

After running `pnpm dev`, you'll have:

- **Frontend**: http://localhost:3000
- **API**: Check SST output for Lambda URL (format: `https://[id].lambda-url.eu-west-2.on.aws/`)
- **AWS Resources**: Deployed to `cubs-site-dev` stack in eu-west-2

## How SST Dev Mode Works

SST v3 dev mode provides a unique development experience:

1. **Live AWS Resources**: Uses real AWS services (DynamoDB, Cognito, S3) in your account
2. **Local Code Execution**: Lambda functions run locally but can access AWS resources
3. **Hot Reload**: Changes to code are instantly reflected without redeployment
4. **Cost-Effective**: Dev resources use on-demand pricing (very low cost for development)

### Frontend Development

The Nuxt dev server runs locally with:
- Hot Module Replacement (HMR) via Vite
- TypeScript checking
- Auto-imports for composables
- Environment variables injected from SST

**Making changes:**
1. Edit files in `frontend/`
2. Browser automatically refreshes
3. No restart needed

### Backend Development

Hono API runs locally with SST:
- Changes to `packages/functions/src/` are hot-reloaded
- DynamoDB, S3, and Cognito are live AWS resources
- Logs appear in your terminal

**Making changes:**
1. Edit files in `packages/functions/src/`
2. SST detects changes and rebuilds
3. Lambda is updated automatically

## Environment Variables

SST automatically provides these to your frontend:

```typescript
// Available in Nuxt via runtime config
NUXT_PUBLIC_API_URL          // Lambda function URL
NUXT_PUBLIC_USER_POOL_ID     // Cognito User Pool ID
NUXT_PUBLIC_USER_POOL_CLIENT_ID // Cognito Client ID
```

Access them in Vue components:
```vue
<script setup>
const config = useRuntimeConfig()
console.log(config.public.apiUrl)
</script>
```

## Testing the API

You can test API endpoints directly:

```bash
# Get the API URL from SST output
API_URL="https://[your-id].lambda-url.eu-west-2.on.aws"

# Test health endpoint
curl $API_URL/health

# Test events endpoint
curl $API_URL/api/events

# Test announcements endpoint
curl $API_URL/api/announcements
```

## Accessing AWS Resources

### DynamoDB

```bash
# List tables in dev stage
aws dynamodb list-tables --profile personal --region eu-west-2

# Scan the Cubs Site table
aws dynamodb scan \
  --table-name [table-name-from-sst] \
  --profile personal \
  --region eu-west-2
```

### Cognito

```bash
# List users in the pool
aws cognito-idp list-users \
  --user-pool-id [user-pool-id-from-sst] \
  --profile personal \
  --region eu-west-2
```

### S3

```bash
# List objects in uploads bucket
aws s3 ls s3://[bucket-name-from-sst] --profile personal
```

## Viewing SST Outputs

```bash
# View current stack outputs
cat .sst/outputs.json
```

Example output:
```json
{
  "api": "https://pvk6uboptdwcq2vo5ngynorv4a0qcrjf.lambda-url.eu-west-2.on.aws/",
  "site": "http://url-unavailable-in-dev.mode",
  "userPoolId": "eu-west-2_dOPq54te7",
  "userPoolClientId": "30cbe3tc28ia9h6ktcst1grrgc"
}
```

## Common Development Tasks

### Add a new API endpoint

1. Edit `packages/functions/src/api.ts`:
```typescript
app.get('/api/new-endpoint', (c) => {
  return c.json({ message: 'Hello from new endpoint' })
})
```

2. Save the file - SST will automatically reload
3. Test: `curl $API_URL/api/new-endpoint`

### Add a new page

1. Create `frontend/pages/new-page.vue`:
```vue
<template>
  <div>
    <h1>New Page</h1>
  </div>
</template>
```

2. Navigate to http://localhost:3000/new-page
3. Nuxt automatically creates the route

### Access DynamoDB from Lambda

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { Resource } from 'sst'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

app.get('/api/item/:id', async (c) => {
  const id = c.req.param('id')

  const result = await client.send(new GetCommand({
    TableName: Resource.CubsSiteData.name,
    Key: { PK: `ITEM#${id}`, SK: 'METADATA' }
  }))

  return c.json(result.Item)
})
```

## Troubleshooting

### SST dev fails to start

**Issue**: Terminal UI crash with "panic: runtime error"

**Solution**: This is a known SST issue with some terminals. The workaround is already implemented - if you see this, the deployment still succeeds in the background.

### Port 3000 already in use

**Solution**:
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
cd frontend && PORT=3001 pnpm dev
```

### Changes not reflecting

**Frontend**: Clear browser cache or hard refresh (Cmd+Shift+R)

**Backend**: Stop and restart `pnpm dev`

### AWS credentials issues

```bash
# Verify AWS profile
aws sts get-caller-identity --profile personal

# If needed, reconfigure
aws configure --profile personal
```

## Stopping Development

Press `Ctrl+C` in the terminal running `pnpm dev`

**Note**: This stops the local servers but **does not remove AWS resources**. Dev stage resources remain deployed (low/no cost when not in use).

## Removing Dev Resources

If you want to completely remove the dev stack:

```bash
pnpm sst remove --stage dev
```

**Warning**: This deletes all data in dev DynamoDB tables, S3 buckets, etc.

## Next Steps

- See [tasks.md](./tasks.md) for the implementation roadmap
- See [design.md](./design.md) for architecture details
- See [deployment.md](./deployment.md) for production deployment

## Useful Commands

```bash
# Lint and format code
pnpm lint
pnpm format

# Type check all packages
pnpm typecheck

# Deploy to staging
pnpm deploy --stage staging

# Deploy to production
pnpm deploy --stage production

# View SST console (web-based dashboard)
pnpm sst console
```

## Development Best Practices

1. **Always run `pnpm dev`** - Don't try to run frontend/backend separately
2. **Use TypeScript strictly** - Type everything
3. **Test API endpoints** - Use curl or Postscotch before integrating
4. **Check CloudWatch logs** - If Lambda fails, check AWS Console → CloudWatch
5. **Keep costs low** - Stop dev when not actively working (just Ctrl+C)
6. **Commit often** - Small, focused commits with clear messages

## Performance Tips

- SST dev is fast after first deployment (30-60 seconds)
- Frontend hot reload is instant via Vite
- Backend changes reload in 1-2 seconds
- DynamoDB queries are fast (single-digit ms)

## Getting Help

- SST Docs: https://sst.dev/docs/
- Nuxt Docs: https://nuxt.com/docs
- Hono Docs: https://hono.dev/docs/
- AWS SDK Docs: https://docs.aws.amazon.com/sdk-for-javascript/
