# NOD POS Backend

Point of Sales system backend for NOD machine capsule stores.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (env, database)
│   ├── database/        # Database connection, migrations, seeders
│   ├── models/          # Data models and repositories
│   ├── services/        # Business logic and domain services
│   ├── routes/          # API routes and handlers
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions (errors, logger, validators)
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── migrations/          # Database migrations
├── package.json
├── tsconfig.json
├── jest.config.js
└── .eslintrc.json
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your local settings:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/nod_pos_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-dev-secret
WEBHOOK_SECRET=webhook-secret
```

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed development data (optional)
npm run db:seed
```

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

### Linting & Formatting

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## API Endpoints (Phase 1)

### Health Check
- `GET /health` - Health check endpoint

### Orders (To Be Implemented)
- `POST /webhooks/orders/ingest` - Receive orders from mobile app
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Get order details
- `PATCH /api/orders/{id}/status` - Update order status

## Architecture Decisions

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma (to be integrated in Phase 1.1.4)
- **Testing**: Jest
- **Logging**: Winston

### Design Patterns
- **Repository Pattern**: For data access abstraction
- **Service Layer**: For business logic separation
- **Middleware**: For cross-cutting concerns
- **Error Handling**: Custom error classes for consistent error responses
- **Event Sourcing**: For audit trails (Phase 5)

## Phase 1: Foundation

### User Story 1.1: Project Infrastructure ✅ (In Progress)
- [x] Initialize backend project structure
- [x] Configure TypeScript
- [x] Set up ESLint and Prettier
- [ ] Set up PostgreSQL database
- [ ] Set up Redis cache
- [ ] Set up ORM (Prisma)
- [ ] Set up error handling and logging
- [ ] Set up testing infrastructure

### User Story 1.2: Order Ingestion Webhook ⏳ (Next)
### User Story 1.3: Order Lifecycle State Machine ⏳ (Next)
### User Story 1.4: Order Query APIs ⏳ (Next)

## Testing Strategy

- **Unit Tests**: Business logic and services
- **Integration Tests**: API endpoints and database
- **E2E Tests**: Full order workflows
- **Coverage Target**: 90%+

## Logging

All logs are structured in JSON format and written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

Logs include context: method, path, status, duration, user_id, order_id, etc.

## Security

- **HTTPS**: Required in production
- **Helmet**: Security headers via helmet middleware
- **CORS**: Configured for allowed origins
- **JWT**: Bearer token authentication for staff endpoints
- **Webhook Signature**: HMAC-SHA256 verification for incoming webhooks
- **Input Validation**: Joi for schema validation
- **Error Handling**: No sensitive data in error responses

## Contributing

1. Create a feature branch from `main`
2. Follow the existing code style (enforced by ESLint)
3. Write tests for new features
4. Ensure coverage remains >90%
5. Create a Pull Request for review

## Deployment

See Phase 8: Deployment & Operations in the main plan.md

---

**Status**: Phase 1.1.1 - Project Infrastructure (In Progress)
**Last Updated**: 2025-11-13
