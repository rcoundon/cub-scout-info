import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

/**
 * Rate Limiting Service
 * Tracks and limits requests by IP address using DynamoDB with TTL
 */

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = Resource.CubsSiteData.name;

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
}

/**
 * Check if a request from an IP address should be allowed
 * @param ipAddress IP address to check
 * @param action Action being rate limited (e.g., 'contact-form')
 */
export async function checkRateLimit(
  ipAddress: string,
  action: string = 'contact-form'
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const ttl = Math.floor((now + RATE_LIMIT_WINDOW_MS) / 1000); // DynamoDB TTL is in seconds

  // Query recent requests from this IP
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND SK > :windowStart',
      ExpressionAttributeValues: {
        ':pk': `RATELIMIT#${action}#${ipAddress}`,
        ':windowStart': `TIMESTAMP#${windowStart}`,
      },
    })
  );

  const requestCount = queryResult.Items?.length || 0;
  const allowed = requestCount < MAX_REQUESTS_PER_WINDOW;

  if (allowed) {
    // Record this request
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `RATELIMIT#${action}#${ipAddress}`,
          SK: `TIMESTAMP#${now}`,
          timestamp: now,
          ttl: ttl, // Auto-delete after window expires
          action,
          ipAddress,
        },
      })
    );
  }

  return {
    allowed,
    remainingRequests: Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount - (allowed ? 1 : 0)),
    resetTime: new Date(now + RATE_LIMIT_WINDOW_MS),
  };
}

/**
 * Get the IP address from a request
 * Handles various proxy headers
 */
export function getIpAddress(headers: Record<string, string | undefined>): string {
  // Check common headers used by proxies and load balancers
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // CloudFront uses this
  const cfConnectingIp = headers['cloudfront-viewer-address'];
  if (cfConnectingIp) {
    return cfConnectingIp.split(':')[0]; // Remove port if present
  }

  // Fallback
  return headers['remote-addr'] || 'unknown';
}
