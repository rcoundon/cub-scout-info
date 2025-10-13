# Cub Scout Division Website - Implementation Tasks

## Phase 1: Project Setup and Infrastructure (Week 1-2)

### 1.1 Project Initialization
- [x] Set up Git repository
- [x] Create project structure
- [x] Initialize frontend (Nuxt 3/Vue.js 3)
- [x] Initialize backend (Hono for AWS Lambda)
- [x] Set up environment configuration (.env files)
- [x] Configure Biome (linting, formatting, import sorting)
- [x] Set up TypeScript (recommended for both frontend and backend)

### 1.2 AWS Account and Infrastructure Setup
- [x] Create/configure AWS account
- [x] Set up AWS CLI and credentials
- [x] Initialize SST v3 project for infrastructure
- [x] Set up development, staging, and production stages
- [x] Document domain name registration process (see specs/domain-setup.md)
- [x] Document SSL certificate setup (see specs/domain-setup.md)
- [x] Document Route 53 configuration (see specs/domain-setup.md)

### 1.3 Development Environment
- [x] Install required dependencies
- [x] ~~Set up local DynamoDB~~ (Not needed - SST dev mode uses live AWS DynamoDB)
- [x] Configure local development server (Nuxt dev server)
- [x] ~~Set up API mocking/testing tools~~ (Not needed - SST dev provides live AWS resources)
- [x] Configure hot reload for development (built-in with Nuxt)

## Phase 2: Backend Development (Week 3-5)

### 2.1 DynamoDB Setup
- [x] Design and finalize DynamoDB table schema (single-table design)
- [x] Define access patterns and GSI requirements
- [x] Set up AWS SDK for DynamoDB in backend (using ElectroDB)
- [x] Create DynamoDB table utilities and helpers (ElectroDB entities)
- [x] Create seed data scripts for development/testing
- [x] Configure point-in-time recovery and backups

### 2.2 Authentication System
- [x] Set up AWS Cognito User Pool
- [x] Configure user authentication flow
- [x] Implement JWT validation
- [x] Create user registration endpoint (admin only)
- [x] Implement password reset functionality
- [x] Set up role-based access control (RBAC)
- [x] Create authentication middleware

### 2.3 API Development - Core Endpoints
- [x] Set up Hono with AWS Lambda adapter
- [x] Configure API routing with Hono
- [x] Implement error handling middleware
- [x] Set up request validation (using Zod)
- [x] Implement logging middleware

### 2.4 Events API
- [x] Create event model and repository (ElectroDB)
- [x] Implement GET /api/events (public - list events)
- [x] Implement GET /api/events/:id (public - event details)
- [x] Implement POST /api/events (create event)
- [x] Implement PUT /api/events/:id (update event)
- [x] Implement DELETE /api/events/:id (delete event)
- [x] Implement GET /api/events/admin/all (admin - all events)
- [x] Add event filtering and search functionality
- [x] Implement recurring event logic
- [x] Create iCal export functionality (calendar.ics endpoint)
- [x] Add event cancellation support
- [x] Add fundraising event type

### 2.5 Announcements API
- [x] Create announcement model and repository (ElectroDB)
- [x] Implement GET /api/announcements (public)
- [x] Implement POST /api/announcements (create announcement)
- [x] Implement PUT /api/announcements/:id (update announcement)
- [x] Implement DELETE /api/announcements/:id (delete announcement)
- [x] Implement GET /api/announcements/admin/all (admin - all announcements)
- [x] Implement announcement expiry logic
- [x] Add priority sorting
- [x] Add category support (general, event, fundraising, urgent, achievement)

### 2.6 File Upload System
- [x] Configure S3 bucket for file storage
- [x] Set up secure S3 access policies
- [x] Implement file upload endpoint
- [x] Add file type and size validation (PDF, Word, Excel, images, TXT up to 10MB)
- [x] Create pre-signed URL generation for downloads
- [x] Implement file deletion
- [x] Add attachment support to events (PDFs, images, documents)
- [ ] Add virus scanning (optional - AWS S3 ClamAV)

### 2.7 User Management API (Admin)
- [x] Implement GET /api/admin/users
- [x] Implement POST /api/admin/users
- [x] Implement PUT /api/admin/users/:id
- [x] Implement DELETE /api/admin/users/:id
- [ ] Add user activity tracking

### 2.8 Additional Features
- [x] Set up AWS SES for email sending
- [x] Implement contact form endpoint with email
- [ ] Create audit logging system
- [ ] Implement analytics data collection
- [ ] Set up API rate limiting

## Phase 3: Frontend Development (Week 6-9)

### 3.1 Design System Setup
- [x] Choose and install UI framework (Tailwind CSS)
- [x] Create design tokens (colors, spacing, typography)
- [x] Build common components (Button, Input, Card, etc.)
- [x] Create layout components (Header, Footer, Navigation)
- [x] Implement responsive navigation with mobile menu
- [x] Set up theming (Scout colors - primary, secondary, accent)
- [x] Fix button sizing consistency across components

### 3.2 Authentication UI
- [x] Create login page (pages/login.vue)
- [x] Create password reset flow
- [x] Implement auth state management (Pinia store)
- [x] Create auth middleware for protected routes (admin, editor)
- [ ] Add session timeout handling
- [ ] Implement "Remember me" functionality

### 3.3 Public Pages
- [x] Create home page (pages/index.vue)
  - [x] Hero section with division info and "When We Meet" section
  - [x] Upcoming events preview by age group
  - [x] Quick access cards for Events, Announcements, Resources
- [x] Create events list page (pages/events/index.vue)
  - [x] Event cards with summary, date, time, location
  - [x] Age group filtering (Beavers/Cubs/Scouts) with localStorage persistence
  - [x] Event type filtering (Meeting/Camp/Trip/Special/Fundraising)
  - [x] Search functionality
  - [x] Calendar subscription (live updates and one-time download)
  - [x] Calendar view toggle (list/calendar)
  - [x] Recurring event visual indicators (stacked cards)
  - [x] Cancelled event indicators with red banner and ring
  - [x] Fixed card alignment for cancelled vs regular events
- [x] Create event detail page (pages/events/[id].vue)
  - [x] Full event information display
  - [x] Cost display (Free or £X.XX)
  - [x] Export to Google Calendar button
  - [x] Download as .ics file
  - [x] Age group and event type badges with colors/icons
  - [x] Download attachments
- [x] Create calendar view component (components/EventsCalendar.vue)
  - [x] Custom calendar implementation (month view)
  - [x] Event colors by age group (Beavers: blue, Cubs: green, Scouts: teal)
  - [x] Event type icons on calendar
  - [x] Event time display (start - end)
  - [x] Event click navigation to detail page
  - [x] Month navigation (prev/next/today)
  - [x] Legend for age groups and event types
- [x] Create about page (pages/about.vue)
  - [x] Useful links section with Fundraising link
- [x] Create contact page (pages/contact.vue)
- [x] Create announcements page (pages/announcements.vue)

### 3.4 Admin Interface
- [x] Create admin dashboard layout (layouts/admin.vue)
  - [x] Top navigation with user info and logout
  - [x] Navigation links (Dashboard, Events, Announcements, Users)
  - [ ] Quick stats on dashboard
- [x] Create event management interface (pages/admin/events/)
  - [x] Event list with edit/delete actions (index.vue)
  - [x] Event creation form ([id].vue with id='new')
  - [x] Event edit form ([id].vue)
  - [x] Event type dropdown (Meeting/Camp/Trip/Special/Fundraising/Other)
  - [x] Age group selection (Beavers/Cubs/Scouts)
  - [x] Date/time picker (datetime-local inputs)
  - [x] Recurring event configuration (frequency, until date)
  - [x] Event cancellation with reason
  - [x] File upload component
  - [ ] Rich text editor for descriptions (currently textarea)
- [x] Create announcement management (pages/admin/announcements/)
  - [x] Announcement list (index.vue)
  - [x] Announcement form ([id].vue)
  - [x] Priority settings (low/medium/high)
  - [x] Category selection (general/event/fundraising/urgent/achievement)
  - [x] Expiry date settings
  - [x] Status settings (draft/published)
- [x] Create user management (pages/admin/users/)
  - [x] User list (index.vue)
  - [x] User creation form ([id].vue)
  - [x] Role assignment (admin/editor/viewer)
  - [x] User deletion
- [ ] Create analytics dashboard
  - [ ] Charts and graphs
  - [ ] Key metrics display

### 3.5 API Integration
- [x] Create Pinia stores for state management
- [x] Implement events store (stores/events.ts)
- [x] Implement announcements store (stores/announcements.ts)
- [x] Implement auth store (stores/auth.ts)
- [x] Implement users store (stores/users.ts)
- [x] Add error handling and display
- [x] Add loading states
- [x] Use $fetch for API calls with proper headers
- [ ] Add optimistic updates
- [ ] Implement data caching strategies

### 3.6 Calendar Functionality
- [x] Create custom calendar component (components/EventsCalendar.vue)
- [x] Implement event rendering on calendar with colors and icons
- [x] Add event click navigation to detail pages
- [x] Implement calendar navigation (prev/next/today buttons)
- [x] Create iCal export functionality (.ics download)
- [x] Add calendar subscription feature (live updates via webcal)
- [x] Support recurring event expansion in calendar view
- [ ] Add week/day views (currently month only)

## Phase 4: Testing (Week 10)

### 4.1 Backend Testing
- [ ] Set up Jest for unit testing
- [ ] Write unit tests for models
- [ ] Write unit tests for services/repositories
- [ ] Write integration tests for API endpoints
- [ ] Test authentication and authorization
- [ ] Test file upload functionality
- [ ] Test error handling
- [ ] Achieve >80% code coverage

### 4.2 Frontend Testing
- [ ] Set up Vitest and Vue Test Utils
- [ ] Write component unit tests
- [ ] Write integration tests for pages
- [ ] Test form validation (VeeValidate)
- [ ] Test authentication flows
- [ ] Set up E2E testing (Cypress or Playwright)
- [ ] Write critical path E2E tests

### 4.3 Security Testing
- [ ] Run security audit (npm audit)
- [ ] Test for XSS vulnerabilities
- [ ] Test for CSRF protection
- [ ] Test authentication bypass attempts
- [ ] Test authorization boundaries
- [ ] Validate input sanitization
- [ ] Test file upload security

### 4.4 Performance Testing
- [ ] Run Lighthouse audits
- [ ] Test page load times
- [ ] Test API response times
- [ ] Load testing with k6 or Artillery
- [ ] Test with slow network conditions
- [ ] Optimize bundle size

## Phase 5: AWS Deployment Setup (Week 11)

### 5.1 Infrastructure Provisioning
- [ ] Define SST v3 resources in sst.config.ts
- [ ] Create DynamoDB table with GSIs using SST
- [ ] Configure DynamoDB on-demand capacity mode
- [ ] Enable point-in-time recovery on DynamoDB
- [ ] Create S3 buckets (frontend via StaticSite, file uploads)
- [ ] Set up CloudFront distribution (automatic with StaticSite)
- [ ] Configure Hono API with SST Function
- [ ] Set up Lambda layers (if needed)
- [ ] Configure Cognito User Pool with SST
- [ ] Set up CloudWatch logs and metrics (automatic)
- [ ] Use SST Config or Parameter Store for secrets

### 5.2 CI/CD Pipeline
- [ ] Set up GitHub Actions or AWS CodePipeline
- [ ] Configure build workflow (Nuxt generate for frontend)
- [ ] Add automated testing to pipeline
- [ ] Set up staging deployment
- [ ] Set up production deployment
- [ ] Configure deployment approvals
- [ ] Add rollback capability
- [ ] Set up deployment notifications

### 5.3 DynamoDB Data Setup
- [ ] Create scripts to initialize DynamoDB table structure
- [ ] Test table structure in staging
- [ ] Create seed data for production (initial admin user)
- [ ] Document GSI usage and access patterns

### 5.4 Monitoring and Alerting
- [ ] Create CloudWatch dashboards
- [ ] Set up error rate alarms
- [ ] Set up performance alarms
- [ ] Configure log aggregation
- [ ] Set up email/SMS alerts
- [ ] Create runbook for common issues

## Phase 6: Launch Preparation (Week 12)

### 6.1 Content Preparation
- [ ] Prepare initial events data
- [ ] Prepare about page content
- [ ] Create initial announcements
- [ ] Prepare user guide for admins

### 6.2 Documentation
- [ ] Write user documentation
- [ ] Write admin documentation
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Document deployment process
- [ ] Create disaster recovery plan

### 6.3 Legal and Compliance
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Implement cookie consent (if needed)
- [ ] Ensure GDPR compliance
- [ ] Get photo consent process in place

### 6.4 Pre-Launch Testing
- [ ] User acceptance testing (UAT)
- [ ] Admin training sessions
- [ ] Test all critical user journeys
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Accessibility testing
- [ ] Final security review

### 6.5 Launch
- [ ] Deploy to production
- [ ] Verify all systems operational
- [ ] Monitor for errors
- [ ] Communicate launch to users
- [ ] Gather initial feedback

## Phase 7: Post-Launch (Week 13+)

### 7.1 Monitoring and Optimization
- [ ] Monitor application performance
- [ ] Review user feedback
- [ ] Identify and fix bugs
- [ ] Optimize slow queries
- [ ] Reduce costs where possible

### 7.2 Feature Enhancements
- [ ] Prioritize feature requests
- [ ] Plan next iteration
- [ ] Implement email notifications (if not in Phase 1)
- [ ] Add photo gallery
- [ ] Implement additional requested features

### 7.3 Maintenance
- [ ] Regular security updates
- [ ] Dependency updates
- [ ] Regular backups verification
- [ ] Performance tuning
- [ ] Cost optimization

## Task Assignment Recommendations

### Critical Path Tasks (Must Complete First)
1. Project setup and infrastructure
2. Database design and setup
3. Authentication system
4. Core Events API
5. Core frontend pages
6. Deployment infrastructure

### Parallel Work Streams
- **Backend Team**: API development, database, authentication
- **Frontend Team**: UI components, pages, integration
- **DevOps**: Infrastructure, CI/CD, monitoring

### Dependencies
- Frontend work depends on API endpoints being available
- Deployment depends on both frontend and backend completion
- Testing can begin once features are partially complete
- Documentation can be written alongside development

## Estimated Timeline
- **Phase 1**: 2 weeks
- **Phase 2**: 3 weeks
- **Phase 3**: 4 weeks
- **Phase 4**: 1 week
- **Phase 5**: 1 week
- **Phase 6**: 1 week
- **Total**: 12 weeks to launch

*Note: Timeline assumes 1-2 developers working part-time. Adjust based on available resources.*

## Recent Updates

### Session: October 2025 - Contact Form Spam Prevention & Auto-Reply
- [x] Implemented honeypot spam detection (hidden 'website' field)
- [x] Added rate limiting (3 submissions per hour per IP)
- [x] Created rate-limit service with DynamoDB TTL auto-cleanup
- [x] Added auto-reply confirmation emails to contact form submitters
- [x] Graceful error handling for email failures
- [x] Parallel email sending (admin notification + sender confirmation)

### Session: October 2025 - Contact Form Email Integration
- [x] Implemented contact form email notifications using AWS SES
- [x] Added sendContactFormNotification function to email service
- [x] Configured FROM_EMAIL and ADMIN_EMAIL environment variables
- [x] Email notifications sent to hello@1stholmergreenscouts.org.uk
- [x] Reply-to header set to contact form submitter for easy replies
- [x] Updated contact page with correct email address
- [x] Verified and tested in production

### Session: October 2025 - Production Deployment
- [x] Deployed to production AWS account (scouts profile)
- [x] Configured custom domain: https://1stholmergreenscouts.org.uk with SSL
- [x] Set up ImprovMX email forwarding (hello@1stholmergreenscouts.org.uk)
- [x] Created admin user with proper ElectroDB integration
- [x] Fixed 502 errors by adding Nitro AWS Lambda preset
- [x] Fixed API URL double slash issue
- [x] Fixed ElectroDB user lookup by using proper create() method
- [x] Cleaned up debug logging from troubleshooting

### Session: December 2024
- [x] Fixed button sizing consistency (View Events / Learn More buttons)
- [x] Fixed event card alignment for cancelled vs regular events
- [x] Added 28px spacer to all cards for consistent content alignment
- [x] Adjusted stacked card shadows for recurring events
- [x] Fixed CSS source map console warning
- [x] Updated tasks.md to reflect actual project state

## Current Status Summary

### ✅ Completed (Core Features Working)
- Infrastructure and deployment (SST v3, AWS Lambda, DynamoDB)
- Authentication system (AWS Cognito, JWT, RBAC)
- Events API with recurring events and iCal export
- Announcements API with categories and expiry
- User management API
- File upload system (S3 integration with attachments)
- Contact form with email notifications and spam prevention
  - Admin notifications to hello@1stholmergreenscouts.org.uk
  - Auto-reply confirmation emails to submitters
  - Honeypot spam detection
  - Rate limiting (3 submissions per hour per IP)
- Full admin interface for managing events, announcements, and users
- Public pages with calendar view and filtering
- Calendar subscription (live updates and downloads)
- Responsive design with Tailwind CSS
- Age group and event type color coding
- Production deployment to custom domain with SSL

### 🚧 In Progress / Needs Work
- Analytics dashboard
- Rich text editor for descriptions
- Audit logging system
- Session timeout handling
- Testing (unit, integration, E2E)
- Documentation (user guide, admin guide)

### 📋 Remaining Priority Tasks
1. **Testing**
   - Backend unit tests
   - Frontend component tests
   - E2E tests for critical paths

2. **Documentation**
   - User guide
   - Admin documentation
   - API documentation

3. **Polish & Optimization**
   - Performance optimization
   - Accessibility improvements
   - SEO optimization
   - Cost optimization

### 🎯 Nice-to-Have Features
- Analytics dashboard with charts
- Rich text editor for event descriptions
- Audit logging for admin actions
- Email notifications for event reminders
- Photo gallery
- Week/day calendar views
- Mobile app (future consideration)
