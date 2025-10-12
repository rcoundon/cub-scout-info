import { vi } from 'vitest'

// Mock environment variables
process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id'
process.env.COGNITO_CLIENT_ID = 'test-client-id'
process.env.AWS_REGION = 'us-east-1'

// Mock SST Resource
vi.mock('sst', () => ({
  Resource: {
    CubsSiteTable: {
      name: 'test-table',
    },
    CubsSiteUploads: {
      name: 'test-uploads-bucket',
    },
    CognitoUserPool: {
      id: 'test-user-pool-id',
    },
  },
}))
