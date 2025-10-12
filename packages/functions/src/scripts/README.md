# Setup Scripts

## Test Users Setup

The `setup-test-users.ts` script automatically creates test users in Cognito and DynamoDB for E2E testing.

### Test Users

The script creates three test users matching the fixtures in `frontend/tests/e2e/fixtures/auth.ts`:

| Role   | Email              | Password    |
|--------|--------------------|-------------|
| Admin  | admin@test.com     | Admin123!   |
| Editor | editor@test.com    | Editor123!  |
| Viewer | viewer@test.com    | Viewer123!  |

### Running the Script

The script must be run with `sst shell` to access SST Resources:

```bash
cd packages/functions
pnpm test:setup-users
```

This will automatically run the script with `sst shell tsx src/scripts/setup-test-users.ts`.

### Package Scripts

From the `packages/functions` directory:

```bash
# Set up test users
pnpm test:setup-users

# Clean up and recreate test users
pnpm test:cleanup-users && pnpm test:setup-users
```

From the `frontend` directory (for E2E tests):

```bash
# Set up test users before running E2E tests
pnpm test:e2e:setup

# Set up users and run E2E tests
pnpm test:e2e:full
```

### What the Script Does

1. **Checks Cognito**: Looks for existing users with the test emails
2. **Creates Users**: If users don't exist, creates them in Cognito with verified emails
3. **Sets Passwords**: Sets permanent passwords (no need to change on first login)
4. **Creates Database Records**: Adds user records to DynamoDB with the correct roles
5. **Idempotent**: Safe to run multiple times - won't duplicate users

### Cleanup Mode

To delete existing test users before recreating them:

```bash
pnpm test:cleanup-users
```

This is useful when:
- Test users are in an inconsistent state
- You need to reset passwords
- You want to ensure a clean slate

### Requirements

- AWS credentials configured (either via environment or `~/.aws/credentials`)
- SST application with state (run `sst dev` at least once)
- Appropriate IAM permissions to:
  - Create and manage Cognito users (`cognito-idp:*`)
  - Read/write DynamoDB tables

### CI/CD Integration

For continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Set up test users
  env:
    COGNITO_USER_POOL_ID: ${{ secrets.COGNITO_USER_POOL_ID }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: eu-west-2
  run: |
    cd packages/functions
    pnpm test:setup-users

- name: Run E2E tests
  run: |
    cd frontend
    pnpm test:e2e
```

### Troubleshooting

**Error: "Cognito User Pool ID not found" or "SST links are not active"**

Make sure you:
1. Have run `sst dev` at least once to create the SST state
2. Are using the package script `pnpm test:setup-users` (which uses `sst shell`)

**Error: "User already exists" in Cognito but not in database**

Run the cleanup script first:
```bash
pnpm test:cleanup-users && pnpm test:setup-users
```

**Error: "AccessDeniedException"**

Your AWS credentials don't have sufficient permissions. Ensure your IAM user/role has:
- `cognito-idp:AdminCreateUser`
- `cognito-idp:AdminSetUserPassword`
- `cognito-idp:AdminGetUser`
- `cognito-idp:AdminDeleteUser`
- `dynamodb:PutItem`
- `dynamodb:GetItem`

### Manual Verification

To verify test users were created correctly:

```bash
# List users in Cognito
aws cognito-idp list-users \
  --user-pool-id YOUR_POOL_ID \
  --filter "email=\"admin@test.com\""

# Query DynamoDB
aws dynamodb scan \
  --table-name YourTableName \
  --filter-expression "email = :email" \
  --expression-attribute-values '{":email":{"S":"admin@test.com"}}'
```
