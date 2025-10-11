import { Entity, Service } from 'electrodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Resource } from 'sst';

/**
 * ElectroDB entity definitions
 * Single-table design for the Cubs Site
 */

// DynamoDB client
const client = new DynamoDBClient({});

// Get table name from SST Resource
const tableName = Resource.CubsSiteData.name;

/**
 * User Entity
 */
export const UserEntity = new Entity(
  {
    model: {
      entity: 'User',
      version: '1',
      service: 'cubs-site',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
      },
      email: {
        type: 'string',
        required: true,
      },
      role: {
        type: ['admin', 'editor', 'viewer'] as const,
        required: true,
      },
      first_name: {
        type: 'string',
        required: true,
      },
      last_name: {
        type: 'string',
        required: true,
      },
      created_at: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
      updated_at: {
        type: 'string',
        required: false,
        readOnly: true,
        watch: '*',
        set: () => new Date().toISOString(),
      },
      last_login: {
        type: 'string',
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'PK',
          composite: ['id'],
          template: 'USER#${id}',
        },
        sk: {
          field: 'SK',
          composite: [],
          template: 'METADATA',
        },
      },
      byEmail: {
        index: 'GSI1',
        pk: {
          field: 'GSI1PK',
          composite: ['email'],
          template: 'EMAIL#${email}',
        },
        sk: {
          field: 'GSI1SK',
          composite: ['id'],
          template: 'USER#${id}',
        },
      },
    },
  },
  { client, table: tableName }
);

/**
 * Event Entity
 */
export const EventEntity = new Entity(
  {
    model: {
      entity: 'Event',
      version: '1',
      service: 'cubs-site',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => crypto.randomUUID(),
      },
      title: {
        type: 'string',
        required: true,
      },
      event_type: {
        type: ['meeting', 'camp', 'trip', 'special', 'other'] as const,
        required: true,
      },
      age_group: {
        type: ['beavers', 'cubs', 'scouts'] as const,
        required: true,
      },
      start_date: {
        type: 'string',
        required: true,
      },
      end_date: {
        type: 'string',
        required: true,
      },
      location: {
        type: 'string',
        required: true,
      },
      description: {
        type: 'string',
        required: true,
      },
      cost: {
        type: 'number',
      },
      what_to_bring: {
        type: 'string',
      },
      rsvp_deadline: {
        type: 'string',
      },
      organizer_name: {
        type: 'string',
      },
      organizer_contact: {
        type: 'string',
      },
      is_recurring: {
        type: 'boolean',
        required: true,
        default: false,
      },
      recurrence_rule: {
        type: 'string',
      },
      status: {
        type: ['draft', 'published', 'cancelled', 'archived'] as const,
        required: true,
        default: 'draft',
      },
      cancellation_reason: {
        type: 'string',
      },
      created_by: {
        type: 'string',
        required: true,
      },
      created_at: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
      updated_at: {
        type: 'string',
        required: false,
        readOnly: true,
        watch: '*',
        set: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'PK',
          composite: ['id'],
          template: 'EVENT#${id}',
        },
        sk: {
          field: 'SK',
          composite: [],
          template: 'METADATA',
        },
      },
      byStatus: {
        index: 'GSI1',
        pk: {
          field: 'GSI1PK',
          composite: ['status'],
          template: 'STATUS#${status}',
        },
        sk: {
          field: 'GSI1SK',
          composite: ['start_date'],
          template: 'DATE#${start_date}',
        },
      },
      byType: {
        index: 'GSI2',
        pk: {
          field: 'GSI2PK',
          composite: ['event_type'],
          template: 'TYPE#${event_type}',
        },
        sk: {
          field: 'GSI2SK',
          composite: ['start_date'],
          template: 'DATE#${start_date}',
        },
      },
    },
  },
  { client, table: tableName }
);

/**
 * Announcement Entity
 */
export const AnnouncementEntity = new Entity(
  {
    model: {
      entity: 'Announcement',
      version: '1',
      service: 'cubs-site',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => crypto.randomUUID(),
      },
      title: {
        type: 'string',
        required: true,
      },
      content: {
        type: 'string',
        required: true,
      },
      priority: {
        type: ['low', 'medium', 'high'] as const,
        required: true,
        default: 'medium',
      },
      expires_at: {
        type: 'string',
      },
      status: {
        type: ['draft', 'published', 'expired'] as const,
        required: true,
        default: 'draft',
      },
      created_by: {
        type: 'string',
        required: true,
      },
      created_at: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
      updated_at: {
        type: 'string',
        required: false,
        readOnly: true,
        watch: '*',
        set: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'PK',
          composite: ['id'],
          template: 'ANNOUNCEMENT#${id}',
        },
        sk: {
          field: 'SK',
          composite: [],
          template: 'METADATA',
        },
      },
      byStatus: {
        index: 'GSI1',
        pk: {
          field: 'GSI1PK',
          composite: ['status'],
          template: 'STATUS#${status}',
        },
        sk: {
          field: 'GSI1SK',
          composite: ['priority', 'created_at'],
          template: 'PRIORITY#${priority}#${created_at}',
        },
      },
    },
  },
  { client, table: tableName }
);

/**
 * Event Attachment Entity
 */
export const AttachmentEntity = new Entity(
  {
    model: {
      entity: 'Attachment',
      version: '1',
      service: 'cubs-site',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => crypto.randomUUID(),
      },
      event_id: {
        type: 'string',
        required: true,
      },
      file_name: {
        type: 'string',
        required: true,
      },
      file_size: {
        type: 'number',
        required: true,
      },
      file_type: {
        type: 'string',
        required: true,
      },
      s3_key: {
        type: 'string',
        required: true,
      },
      uploaded_by: {
        type: 'string',
        required: true,
      },
      uploaded_at: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'PK',
          composite: ['event_id'],
          template: 'EVENT#${event_id}',
        },
        sk: {
          field: 'SK',
          composite: ['id'],
          template: 'ATTACHMENT#${id}',
        },
      },
    },
  },
  { client, table: tableName }
);

/**
 * Audit Log Entity
 */
export const AuditEntity = new Entity(
  {
    model: {
      entity: 'Audit',
      version: '1',
      service: 'cubs-site',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => crypto.randomUUID(),
      },
      user_id: {
        type: 'string',
        required: true,
      },
      action: {
        type: 'string',
        required: true,
      },
      entity_type: {
        type: 'string',
        required: true,
      },
      entity_id: {
        type: 'string',
        required: true,
      },
      details: {
        type: 'any',
      },
      ip_address: {
        type: 'string',
      },
      created_at: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'PK',
          composite: ['user_id'],
          template: 'AUDIT#${user_id}',
        },
        sk: {
          field: 'SK',
          composite: ['created_at', 'id'],
          template: '${created_at}#${id}',
        },
      },
      byEntity: {
        index: 'GSI1',
        pk: {
          field: 'GSI1PK',
          composite: ['entity_type', 'entity_id'],
          template: 'AUDIT_BY_ENTITY#${entity_type}#${entity_id}',
        },
        sk: {
          field: 'GSI1SK',
          composite: ['created_at'],
          template: '${created_at}',
        },
      },
    },
  },
  { client, table: tableName }
);

/**
 * Contact Message Entity
 */
export const ContactMessageEntity = new Entity(
  {
    model: {
      entity: 'ContactMessage',
      version: '1',
      service: 'cubs-site',
    },
    attributes: {
      id: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => crypto.randomUUID(),
      },
      name: {
        type: 'string',
        required: true,
      },
      email: {
        type: 'string',
        required: true,
      },
      subject: {
        type: 'string',
        required: true,
      },
      message: {
        type: 'string',
        required: true,
      },
      status: {
        type: ['new', 'read', 'replied', 'archived'] as const,
        required: true,
        default: 'new',
      },
      created_at: {
        type: 'string',
        required: true,
        readOnly: true,
        default: () => new Date().toISOString(),
      },
      updated_at: {
        type: 'string',
        required: false,
        readOnly: true,
        watch: '*',
        set: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: 'PK',
          composite: ['id'],
          template: 'CONTACT#${id}',
        },
        sk: {
          field: 'SK',
          composite: [],
          template: 'METADATA',
        },
      },
      byStatus: {
        index: 'GSI1',
        pk: {
          field: 'GSI1PK',
          composite: ['status'],
          template: 'CONTACT_STATUS#${status}',
        },
        sk: {
          field: 'GSI1SK',
          composite: ['created_at'],
          template: '${created_at}',
        },
      },
    },
  },
  { client, table: tableName }
);

/**
 * Create a Service to access all entities
 * This allows for transactions and batch operations
 */
export const CubsService = new Service(
  {
    user: UserEntity,
    event: EventEntity,
    announcement: AnnouncementEntity,
    attachment: AttachmentEntity,
    audit: AuditEntity,
    contactMessage: ContactMessageEntity,
  },
  { client, table: tableName }
);
