# Syzy Waitlist Backend

NestJS backend for the Syzy waitlist platform.

## Setup

1. Start infrastructure: `docker compose up -d`
2. Install deps: `pnpm install`
3. Generate Prisma client: `pnpm prisma:generate`
4. Run migrations: `pnpm prisma:migrate`
5. Seed initial data: `pnpm prisma:seed`
6. Start dev: `pnpm start:dev`

## Commands

- `pnpm start:dev` - Watch mode
- `pnpm build` - Production build
- `pnpm test` - Unit tests
- `pnpm test:e2e` - E2E tests
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run migrations
- `pnpm prisma:seed` - Seed data

## Endpoints

- GET /health - Service health
- GET /api-json - OpenAPI spec
- GET /api - Swagger UI
