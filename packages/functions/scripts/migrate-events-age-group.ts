/**
 * Migration script to add age_group field to existing events
 * Sets all existing events to 'cubs'
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function migrateEvents() {
  const tableName = Resource.CubsSiteData.name;

  console.log(`Scanning table: ${tableName}`);

  // Scan for all items
  const scanResult = await docClient.send(
    new ScanCommand({
      TableName: tableName,
    })
  );

  // Filter for Event entities (ElectroDB stores entity type in __edb_e__)
  const allItems = scanResult.Items || [];
  const events = allItems.filter((item) => item.__edb_e__ === 'Event');
  console.log(`Found ${events.length} events`);

  let updated = 0;
  let alreadyHasAgeGroup = 0;

  // Update each event to add age_group if it doesn't have one
  for (const event of events) {
    if (event.age_group) {
      console.log(`Event ${event.id} already has age_group: ${event.age_group}`);
      alreadyHasAgeGroup++;
      continue;
    }

    console.log(`Updating event ${event.id} to add age_group: cubs`);

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          PK: event.PK,
          SK: event.SK,
        },
        UpdateExpression: 'SET age_group = :ageGroup',
        ExpressionAttributeValues: {
          ':ageGroup': 'cubs',
        },
      })
    );

    updated++;
  }

  console.log('\nMigration complete!');
  console.log(`- Total events: ${events.length}`);
  console.log(`- Already had age_group: ${alreadyHasAgeGroup}`);
  console.log(`- Updated: ${updated}`);
}

// Run the migration
migrateEvents()
  .then(() => {
    console.log('Migration successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
