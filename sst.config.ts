/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST v3 Configuration
 * Defines all AWS infrastructure for the Cubs Site
 */
export default $config({
  app(input) {
    return {
      name: 'cubs-site',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-2', // London
          profile: input?.stage === 'production'
            ? process.env.AWS_PROFILE || 'scouts'
            : process.env.AWS_PROFILE || 'personal',
        },
      },
    };
  },
  async run() {
    // DynamoDB Table
    const table = new sst.aws.Dynamo('CubsSiteData', {
      fields: {
        PK: 'string',
        SK: 'string',
        GSI1PK: 'string',
        GSI1SK: 'string',
        GSI2PK: 'string',
        GSI2SK: 'string',
      },
      primaryIndex: { hashKey: 'PK', rangeKey: 'SK' },
      globalIndexes: {
        GSI1: { hashKey: 'GSI1PK', rangeKey: 'GSI1SK' },
        GSI2: { hashKey: 'GSI2PK', rangeKey: 'GSI2SK' },
      },
      stream: 'new-and-old-images',
      transform: {
        table: {
          pointInTimeRecovery: {
            enabled: true, // Enable point-in-time recovery (35-day retention)
          },
        },
      },
    });

    // S3 Bucket for file uploads
    const uploadsBucket = new sst.aws.Bucket('CubsSiteUploads', {
      public: false,
      transform: {
        bucket: (args, _opts) => {
          args.versionings = [{
            enabled: true,
          }];
        }              
      },
    });

    // Cognito User Pool
    const auth = new sst.aws.CognitoUserPool('CubsSiteAuth', {
      usernames: ['email'],
    });

    // Create a User Pool Client using AWS provider directly
    const authClient = new aws.cognito.UserPoolClient('CubsSiteAuthClient', {
      userPoolId: auth.id,
      explicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_ADMIN_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
      ],
    });

    // Hono API
    const api = new sst.aws.Function('CubsSiteApi', {
      handler: 'packages/functions/src/api.handler',
      link: [table, uploadsBucket, auth],
      runtime: 'nodejs22.x',
      url: {
        cors: {
          allowOrigins: ['*'],
          allowMethods: ['*'],
          allowHeaders: ['*'],
          allowCredentials: true,
        }
      },
      environment: {
        NODE_ENV: $app.stage === 'production' ? 'production' : 'development',
        USER_POOL_CLIENT_ID: authClient.id,
        ORGANIZATION_NAME: '1st Holmer Green Scout Group',
        FROM_EMAIL: 'hello@1stholmergreenscouts.org.uk',
        ADMIN_EMAIL: 'hello@1stholmergreenscouts.org.uk',
        SITE_URL: $app.stage === 'production'
          ? 'https://1stholmergreenscouts.org.uk'
          : 'http://localhost:3000',
      },
      permissions: [
        {
          actions: ['ses:SendEmail', 'ses:SendRawEmail'],
          resources: ['*'],
        },
      ],
    });

    // Nuxt Frontend
    const site = new sst.aws.Nuxt('CubsSiteFrontend', {
      path: 'frontend',
      domain: $app.stage === 'production'
        ? '1stholmergreenscouts.org.uk'
        : undefined,
      environment: {
        NUXT_PUBLIC_API_URL: api.url.apply(url => url.replace(/\/$/, '')),
        NUXT_PUBLIC_USER_POOL_ID: auth.id,
        NUXT_PUBLIC_USER_POOL_CLIENT_ID: authClient.id,
      },
    });

    return {
      api: api.url,
      site: site.url,
      userPoolId: auth.id,
      userPoolClientId: authClient.id,
    };
  },
});
