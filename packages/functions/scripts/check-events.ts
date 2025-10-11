/**
 * Script to check all events in the database
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function checkEvents() {
  const tableName = Resource.CubsSiteData.name;

  console.log(`Scanning table: ${tableName}\n`);

  // Scan entire table
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: tableName,
    })
  );

  const items = scanResult.Items || [];
  console.log(`Total items in table: ${items.length}`);

  // Filter for events (using ElectroDB entity type marker)
  const events = items.filter((item) => item.__edb_e__ === 'Event');
  console.log(`Events found: ${events.length}\n`);

  // Show details of each event
  events.forEach((event, index) => {
    console.log(`Event ${index + 1}:`);
    console.log(`  ID: ${event.id}`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Type: ${event.event_type}`);
    console.log(`  Age Group: ${event.age_group || 'MISSING'}`);
    console.log(`  Status: ${event.status}`);
    console.log(`  PK: ${event.PK}`);
    console.log();
  });

  // Count by entity type
  const entityTypes: Record<string, number> = {};
  items.forEach((item) => {
    const type = item.__edb_e__ || 'unknown';
    entityTypes[type] = (entityTypes[type] || 0) + 1;
  });

  console.log('Entity counts:');
  Object.entries(entityTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

// Run the check
checkEvents()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });
