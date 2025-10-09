# Cub Scout Division Website - Design Document

## Architecture Overview

### Architecture Pattern
**Serverless Three-Tier Architecture**
- **Presentation Layer**: Static Vue.js frontend served via CloudFront + S3
- **Application Layer**: Serverless API using AWS Lambda + API Gateway
- **Data Layer**: Amazon DynamoDB for data storage

### Why Serverless?
- Cost-effective for small to medium traffic
- Auto-scaling capabilities
- Minimal operational overhead
- Pay only for what you use
- Good for organizations with variable traffic patterns

## Technology Stack

### Frontend
- **Framework**: Vue.js 3 with Nuxt 3 (Static Site Generation)
  - Excellent SEO for public pages
  - Fast page loads through static generation
  - Built-in routing with Vue Router
  - Server-side rendering capabilities
  - Composition API for better code organization

- **UI Framework**: Vuetify 3 or Tailwind CSS
  - Responsive components out of the box
  - Accessibility built-in
  - Consistent design system
  - Material Design components (Vuetify)

- **Calendar Component**: FullCalendar Vue or Vue Cal
  - Multiple view options (month, week, day, agenda)
  - Event interaction support
  - Mobile-responsive
  - Native Vue integration

- **State Management**: Pinia (official Vue store)
  - Type-safe and intuitive
  - DevTools integration
  - Lightweight and performant
  - Better TypeScript support than Vuex

- **Forms**: VeeValidate or Vuelidate
  - Schema-based validation
  - Easy integration with UI components
  - Async validation support

### Backend
- **Runtime**: Node.js 20.x on AWS Lambda
- **API Framework**: Express.js with Serverless HTTP
- **Authentication**: AWS Cognito
  - Managed user pools
  - Built-in security features
  - MFA support
  - Social login capability (future)

- **File Storage**: Amazon S3
  - Event documents and attachments
  - Photo gallery images
  - Automatic versioning

### Database
**Amazon DynamoDB**
- Fully serverless with no infrastructure management
- Very cost-effective for small to medium workloads
- Single-digit millisecond latency
- Auto-scaling with on-demand pricing
- Point-in-time recovery for backups
- Perfect for read-heavy event viewing patterns
- No cold starts or connection pooling issues

**Why DynamoDB?**
- Significantly lower cost than Aurora for this use case
- No database maintenance or patching required
- Seamless scaling from zero to any load
- Built-in encryption at rest
- Ideal for document-style data (events, announcements)
- DynamoDB Streams for audit logging

### Additional AWS Services
- **CloudFront**: CDN for global content delivery
- **Route 53**: DNS management
- **Certificate Manager**: SSL/TLS certificates
- **CloudWatch**: Logging and monitoring
- **SES**: Email notifications (optional)
- **Systems Manager Parameter Store**: Store API keys and configuration (free tier available)

## DynamoDB Schema Design

### Table Design Philosophy
DynamoDB is a NoSQL database that requires careful access pattern design. We'll use a single-table design with GSIs (Global Secondary Indexes) for efficient queries.

### Main Table: `cubs-site-data`

**Primary Key Structure:**
- **PK** (Partition Key): Entity type and ID (e.g., `USER#uuid`, `EVENT#uuid`)
- **SK** (Sort Key): Related entity or timestamp (e.g., `METADATA`, `ATTACHMENT#uuid`, date)

#### Access Patterns

**1. Users Table Items**
```
PK: USER#<cognito_id>
SK: METADATA
Attributes:
  - email (String)
  - role (String: 'admin', 'editor', 'viewer')
  - first_name (String)
  - last_name (String)
  - created_at (String: ISO 8601)
  - updated_at (String: ISO 8601)
  - last_login (String: ISO 8601)
  - GSI1PK: EMAIL#<email> (for lookup by email)
  - GSI1SK: USER#<cognito_id>
```

**2. Events Table Items**
```
PK: EVENT#<event_id>
SK: METADATA
Attributes:
  - title (String)
  - event_type (String: 'meeting', 'camp', 'trip', 'special', 'other')
  - start_date (String: ISO 8601)
  - end_date (String: ISO 8601)
  - location (String)
  - description (String)
  - cost (Number)
  - what_to_bring (String)
  - rsvp_deadline (String: ISO 8601)
  - organizer_name (String)
  - organizer_contact (String)
  - is_recurring (Boolean)
  - recurrence_rule (String: iCal RRULE format)
  - status (String: 'draft', 'published', 'cancelled', 'archived')
  - created_by (String: cognito_id)
  - created_at (String: ISO 8601)
  - updated_at (String: ISO 8601)
  - GSI1PK: STATUS#<status>
  - GSI1SK: DATE#<start_date>
  - GSI2PK: TYPE#<event_type>
  - GSI2SK: DATE#<start_date>
```

**3. Event Attachments**
```
PK: EVENT#<event_id>
SK: ATTACHMENT#<attachment_id>
Attributes:
  - file_name (String)
  - file_size (Number)
  - file_type (String)
  - s3_key (String)
  - uploaded_by (String: cognito_id)
  - uploaded_at (String: ISO 8601)
```

**4. Announcements**
```
PK: ANNOUNCEMENT#<announcement_id>
SK: METADATA
Attributes:
  - title (String)
  - content (String)
  - priority (Number)
  - expires_at (String: ISO 8601)
  - status (String: 'draft', 'published', 'expired')
  - created_by (String: cognito_id)
  - created_at (String: ISO 8601)
  - updated_at (String: ISO 8601)
  - GSI1PK: STATUS#<status>
  - GSI1SK: PRIORITY#<priority>#<created_at>
```

**5. Audit Log**
```
PK: AUDIT#<user_id>
SK: <timestamp>#<action_id>
Attributes:
  - action (String)
  - entity_type (String)
  - entity_id (String)
  - details (Map)
  - ip_address (String)
  - created_at (String: ISO 8601)
  - GSI1PK: AUDIT_BY_ENTITY#<entity_type>#<entity_id>
  - GSI1SK: <timestamp>
```

### Global Secondary Indexes (GSIs)

**GSI1: Entity Lookup Index**
- **PK**: GSI1PK
- **SK**: GSI1SK
- Use cases:
  - Find user by email
  - Query events by status and date
  - Query announcements by status and priority

**GSI2: Type and Date Index**
- **PK**: GSI2PK
- **SK**: GSI2SK
- Use cases:
  - Query events by type and date range
  - Filter calendar view by event type

### Query Examples

**Get all published events ordered by date:**
```
Query: GSI1PK = "STATUS#published" AND GSI1SK begins_with "DATE#"
```

**Get event with all attachments:**
```
Query: PK = "EVENT#<id>" AND SK begins_with ""
```

**Get user's audit trail:**
```
Query: PK = "AUDIT#<user_id>" AND SK begins_with ""
ScanIndexForward = false (for newest first)
```

**Get events by type in date range:**
```
Query: GSI2PK = "TYPE#camp" AND GSI2SK BETWEEN "DATE#2024-01-01" AND "DATE#2024-12-31"
```

### DynamoDB Configuration

**Capacity Mode:** On-Demand
- No capacity planning required
- Pay per request
- Automatically scales
- Cost-effective for variable workloads

**Point-in-Time Recovery:** Enabled
- Continuous backups
- Restore to any point in last 35 days

**Encryption:** Default AWS owned encryption key
- No additional cost
- Automatic encryption at rest

**DynamoDB Streams:** Enabled
- Capture all changes
- Use for audit logging
- Trigger Lambda for notifications (future)

## API Design

### Public Endpoints (No Auth Required)

```
GET    /api/events                    # List all published events
GET    /api/events/:id                # Get event details
GET    /api/events/calendar           # Get events in calendar format
GET    /api/events/export/:id         # Export event to iCal
GET    /api/announcements             # List active announcements
GET    /api/about                     # Get about information
POST   /api/contact                   # Submit contact form
```

### Protected Endpoints (Auth Required)

```
POST   /api/auth/login                # Login (handled by Cognito)
POST   /api/auth/logout               # Logout
POST   /api/auth/reset-password       # Password reset

GET    /api/admin/events              # List all events (including drafts)
POST   /api/admin/events              # Create new event
PUT    /api/admin/events/:id          # Update event
DELETE /api/admin/events/:id          # Delete event
POST   /api/admin/events/:id/duplicate # Duplicate event

POST   /api/admin/attachments         # Upload attachment
DELETE /api/admin/attachments/:id     # Delete attachment

GET    /api/admin/announcements       # List all announcements
POST   /api/admin/announcements       # Create announcement
PUT    /api/admin/announcements/:id   # Update announcement
DELETE /api/admin/announcements/:id   # Delete announcement

GET    /api/admin/users               # List users (admin only)
POST   /api/admin/users               # Create user (admin only)
PUT    /api/admin/users/:id           # Update user role (admin only)
DELETE /api/admin/users/:id           # Delete user (admin only)

GET    /api/admin/analytics           # Get analytics data
GET    /api/admin/audit-log           # Get audit log
```

## Frontend Architecture

### Page Structure

```
/                           # Home page (announcements + upcoming events)
/calendar                   # Calendar view
/events                     # Event list view
/events/:id                 # Event detail page
/about                      # About the division
/contact                    # Contact form
/admin                      # Admin dashboard (protected)
/admin/events               # Event management (protected)
/admin/events/new           # Create event (protected)
/admin/events/:id/edit      # Edit event (protected)
/admin/announcements        # Announcement management (protected)
/admin/users                # User management (protected, admin only)
/admin/analytics            # Analytics dashboard (protected)
/login                      # Login page
```

### Component Structure (Nuxt 3)

```
cubs-site-frontend/
├── components/
│   ├── common/
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   ├── Navigation.vue
│   │   └── Layout.vue
│   ├── events/
│   │   ├── EventCard.vue
│   │   ├── EventList.vue
│   │   ├── EventCalendar.vue
│   │   ├── EventDetail.vue
│   │   └── EventForm.vue
│   ├── announcements/
│   │   ├── AnnouncementBanner.vue
│   │   ├── AnnouncementList.vue
│   │   └── AnnouncementForm.vue
│   └── admin/
│       ├── Dashboard.vue
│       ├── UserManagement.vue
│       └── Analytics.vue
├── pages/
│   ├── index.vue                      # Home page
│   ├── calendar.vue                    # Calendar view
│   ├── about.vue                       # About page
│   ├── contact.vue                     # Contact form
│   ├── login.vue                       # Login page
│   ├── events/
│   │   ├── index.vue                   # Events list
│   │   └── [id].vue                    # Event detail (dynamic route)
│   └── admin/
│       ├── index.vue                   # Admin dashboard
│       ├── events/
│       │   ├── index.vue               # Event management
│       │   ├── new.vue                 # Create event
│       │   └── [id]/edit.vue           # Edit event
│       ├── announcements.vue
│       ├── users.vue                   # User management
│       └── analytics.vue
├── composables/
│   ├── useAuth.ts                      # Auth composable
│   ├── useEvents.ts                    # Events data fetching
│   ├── useAnnouncements.ts             # Announcements data
│   └── useApi.ts                       # API client wrapper
├── stores/
│   ├── auth.ts                         # Pinia auth store
│   ├── events.ts                       # Pinia events store
│   └── announcements.ts                # Pinia announcements store
├── middleware/
│   ├── auth.ts                         # Authentication middleware
│   └── admin.ts                        # Admin role check
├── layouts/
│   ├── default.vue                     # Public layout
│   └── admin.vue                       # Admin layout
├── plugins/
│   ├── api.ts                          # API plugin
│   └── auth.ts                         # Auth plugin (Cognito)
├── utils/
│   ├── api.ts                          # API helpers
│   ├── auth.ts                         # Auth utilities
│   └── date.ts                         # Date formatting
├── assets/
│   └── css/
│       └── main.css                    # Global styles
└── nuxt.config.ts                      # Nuxt configuration
```

## Security Design

### Authentication Flow
1. User enters credentials on login page
2. Frontend calls AWS Cognito
3. Cognito validates and returns JWT tokens
4. Frontend stores tokens securely (httpOnly cookies preferred)
5. API Gateway validates JWT on each request
6. Lambda Authorizer checks user role for protected operations

### Authorization Levels
- **Public**: View events, announcements, about page
- **Viewer**: All public + access to admin dashboard (read-only)
- **Editor**: Viewer + create/edit/delete events and announcements
- **Admin**: Editor + user management + analytics access

### Data Protection
- All data in transit encrypted (HTTPS/TLS)
- All data at rest encrypted (S3, DynamoDB encryption)
- No database credentials needed (IAM-based access to DynamoDB)
- Regular security updates
- Input validation and sanitization
- CORS configuration for API Gateway
- Rate limiting on API endpoints

## Deployment Strategy

### Environment Structure
1. **Development**: Local development environment
2. **Staging**: AWS staging environment for testing
3. **Production**: AWS production environment

### CI/CD Pipeline (GitHub Actions or AWS CodePipeline)

```yaml
Workflow:
1. Code pushed to repository
2. Run tests (unit, integration)
3. Run linting and security scans
4. Build frontend (Nuxt generate for static site)
5. Deploy frontend to S3
6. Invalidate CloudFront cache
7. Deploy Lambda functions (if changed)
8. Update DynamoDB tables (if schema changed)
9. Run smoke tests
10. Notify team of deployment status
```

### Infrastructure as Code
**Use AWS CDK or Terraform**
- Version controlled infrastructure
- Reproducible deployments
- Easy rollback
- Environment parity

### Deployment Steps
1. **Initial Setup** (one-time)
   - Provision AWS infrastructure (DynamoDB, S3, CloudFront, etc.)
   - Set up domain and SSL certificate
   - Configure Cognito user pool
   - Create DynamoDB table and GSIs
   - Create initial admin user in Cognito and DynamoDB

2. **Application Deployment**
   - Build frontend static files (nuxt generate)
   - Upload to S3
   - Deploy Lambda functions
   - Update API Gateway
   - Update DynamoDB table structure (if needed)
   - Invalidate CDN cache

3. **Post-Deployment**
   - Verify health checks
   - Check CloudWatch logs
   - Test critical paths
   - Monitor for errors

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled (35-day retention)
- **DynamoDB**: On-demand backups before major schema changes
- **S3 Files**: Versioning enabled, lifecycle policy for old versions
- **Code**: Git repository with tags for releases
- **Configuration**: Infrastructure as Code in version control

### Monitoring and Alerts
- **CloudWatch Dashboards**
  - API response times
  - Lambda execution duration
  - Error rates
  - DynamoDB read/write capacity consumption
  - DynamoDB throttling events

- **Alarms**
  - 5xx error rate > threshold
  - Lambda function errors
  - DynamoDB throttling events
  - DynamoDB user errors > threshold
  - Unusual traffic patterns

### Disaster Recovery
- **RTO** (Recovery Time Objective): 2 hours (improved with DynamoDB)
- **RPO** (Recovery Point Objective): 5 minutes (with point-in-time recovery)
- DynamoDB is multi-AZ by default
- S3 cross-region replication (optional)
- Documented recovery procedures

## Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization (WebP format, responsive images)
- Caching strategies (service worker for PWA)
- Minification and compression
- CDN for static assets

### Backend
- Lambda function optimization (minimize cold starts)
- Reuse AWS SDK clients across invocations
- API response caching (API Gateway cache)
- Efficient DynamoDB queries using GSIs
- Pagination for large datasets

### Database
- Design GSIs for access patterns
- Use Query instead of Scan operations
- Implement pagination with LastEvaluatedKey
- Batch operations for multiple items (BatchGetItem, BatchWriteItem)
- Use DynamoDB Accelerator (DAX) if caching needed (likely not needed for this scale)

## Scalability Considerations

### Current Scale
- ~50-200 families (100-400 users)
- ~100 events per year
- ~10 active announcements
- Minimal concurrent admin users

### Growth Capacity
- Architecture supports 100x growth without major changes
- Lambda auto-scales automatically
- DynamoDB on-demand scales automatically (up to 40K+ requests/second)
- CloudFront handles global traffic
- No infrastructure provisioning needed for scale

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance (WCAG AA)
- Responsive font sizes
- Focus indicators

## Future Enhancements

- Mobile app (Vue Native, React Native, or Flutter)
- Online payments integration (Stripe)
- Attendance tracking
- Member directory
- Badge progress tracking
- Email/SMS notification system (using AWS SNS/SES)
- Photo gallery with automated consent management
- Integration with Scouts UK systems
- Progressive Web App (PWA) features for offline access
- Push notifications for event reminders
