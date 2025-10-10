# Cub Scout Division Website

A modern, serverless website for UK Cub Scout divisions to manage and display events, announcements, and division information for parents and guardians.

## Overview

This website provides a simple, mobile-friendly platform for Cub Scout leaders to manage events and communicate with parents. It features a public-facing event calendar and an administrative interface for managing content.

## Features

### Public Features
- **Event Calendar**: Interactive calendar view with month/week/day displays
- **Event Details**: Comprehensive event information including location, cost, requirements
- **Announcements**: Priority-based announcements section on home page
- **Calendar Export**: Export events to Google Calendar, Apple Calendar, or iCal
- **Mobile Responsive**: Fully responsive design for all devices
- **Fast Performance**: Static site generation for optimal page load speeds

### Administrative Features
- **Event Management**: Create, edit, duplicate, and delete events
- **Announcement Management**: Manage announcements with priority and expiry dates
- **File Attachments**: Upload permission slips, itineraries, and documents
- **User Management**: Role-based access control (Admin, Editor, Viewer)
- **Analytics Dashboard**: View website usage and event engagement
- **Audit Logging**: Track all administrative actions

## Technology Stack

### Frontend
- **Framework**: Vue.js 3 with Nuxt 3
- **UI Framework**: Vuetify 3 or Tailwind CSS
- **State Management**: Pinia
- **Calendar**: FullCalendar Vue
- **Forms**: VeeValidate
- **Build**: Static Site Generation (SSG)

### Backend
- **Runtime**: Node.js 20.x on AWS Lambda
- **API Framework**: Hono (ultrafast, lightweight)
- **Authentication**: AWS Cognito
- **File Storage**: Amazon S3

### Database
- **Primary**: Amazon DynamoDB (single-table design)
- **Backup**: Point-in-time recovery (35-day retention)

### Infrastructure
- **Hosting**: AWS (CloudFront + S3)
- **CDN**: CloudFront
- **DNS**: Route 53
- **SSL**: AWS Certificate Manager
- **Monitoring**: CloudWatch
- **IaC**: SST v3 (Serverless Stack)
- **Tooling**: Biome (linting, formatting)

## Documentation

All project documentation is located in the `specs/` directory:

- **[requirements.md](specs/requirements.md)**: Detailed functional and non-functional requirements
- **[design.md](specs/design.md)**: Architecture, database schema, and technical design
- **[tasks.md](specs/tasks.md)**: 12-week implementation plan broken into phases
- **[development-guide.md](specs/development-guide.md)**: Development workflow and best practices
- **[deployment.md](specs/deployment.md)**: AWS deployment guide and CI/CD setup
- **[domain-setup.md](specs/domain-setup.md)**: Domain registration and SSL certificate setup

## Project Structure

```
cubs-site/
├── frontend/              # Nuxt 3 frontend application
│   ├── components/        # Vue components
│   ├── pages/            # Page components (auto-routed)
│   ├── composables/      # Composable functions
│   ├── stores/           # Pinia stores
│   ├── middleware/       # Route middleware
│   └── nuxt.config.ts    # Nuxt configuration
├── packages/
│   └── functions/        # Hono API backend
│       ├── src/
│       │   ├── api.ts    # Main Hono app
│       │   ├── routes/   # API routes
│       │   ├── services/ # Business logic
│       │   └── utils/    # Utilities
│       └── package.json
├── sst.config.ts         # SST infrastructure definition
├── specs/               # Project documentation
├── biome.json           # Biome configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- pnpm 9.x or later (`npm install -g pnpm`)
- AWS CLI configured with 'personal' profile
- AWS account (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/cubs-site.git
   cd cubs-site
   ```

2. **Verify AWS profile**
   ```bash
   # Check that 'personal' profile is configured
   aws sts get-caller-identity --profile personal
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Start SST development environment**
   ```bash
   # From project root
   pnpm dev

   # This will:
   # - Create live AWS resources in your dev stage
   # - Connect your local code to AWS
   # - Enable hot-reloading for Lambda functions
   # - Start the Nuxt dev server
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: Provided by SST (check sst dev output)

## Deployment

### Quick Deployment

See [deployment.md](specs/deployment.md) for detailed deployment instructions.

**Summary:**
```bash
# 1. Deploy to development
pnpm deploy

# 2. Deploy to production
pnpm deploy --stage production
```

### Estimated Costs

- **Monthly**: £15-60
- **DynamoDB**: £2-10
- **Lambda**: £0-5 (free tier)
- **S3**: £1-5
- **CloudFront**: £5-20
- **Other**: £5-20

## Development

### Frontend Development

```bash
# Run dev server with hot reload (via SST)
pnpm dev

# Build for production
cd frontend && pnpm generate

# Run tests
cd frontend && pnpm test

# Lint and format
pnpm lint
pnpm format
```

### Backend Development

```bash
# Run SST in dev mode (live Lambda development)
pnpm dev

# Run tests
cd packages/functions && pnpm test

# Lint and format with Biome
pnpm lint
pnpm format

# Deploy to AWS
pnpm deploy --stage production
```

## Testing

### Frontend Tests
```bash
cd frontend
pnpm test              # Unit tests (Vitest)
pnpm test:e2e         # E2E tests (Cypress/Playwright)
```

### Backend Tests
```bash
cd packages/functions
pnpm test                 # Unit tests (Jest)
pnpm test:integration     # Integration tests
```

## Security

- All data encrypted in transit (HTTPS/TLS)
- All data encrypted at rest (S3, DynamoDB)
- GDPR compliant
- Role-based access control
- AWS Cognito authentication
- Regular security audits

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Submit a pull request

Please ensure:
- All tests pass
- Code follows ESLint rules
- Documentation is updated
- Commit messages are descriptive

## Support

For issues, questions, or contributions:
- Create an issue in this repository
- Contact the technical lead
- See documentation in `specs/` directory

## License

This project is licensed for use by [Your Cub Scout Division Name].

## Acknowledgments

- Built for UK Cub Scouts
- Powered by AWS serverless architecture
- Vue.js and Nuxt community

---

**Status**: In Development
**Version**: 0.1.0
**Last Updated**: October 2024
