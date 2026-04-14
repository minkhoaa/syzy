# Kubb Setup Guide - Oyrade Frontend

Complete guide for setting up and configuring Kubb to automatically generate API code from NestJS backend.

## Introduction

Kubb is a tool that automatically generates TypeScript code from OpenAPI specifications. It provides:
- Automatic TypeScript types generation from API schemas
- Generated Axios client functions
- Ready-to-use React Query hooks
- Type-safety between frontend and backend

## Prerequisites

- Node.js 18+ and pnpm
- NestJS backend running with Swagger/OpenAPI
- Next.js 14+ project with TypeScript

## Installation

### 1. Dependencies

Install required packages:

```bash
pnpm add -D @kubb/cli @kubb/core @kubb/plugin-client @kubb/plugin-oas @kubb/plugin-react-query @kubb/plugin-ts
```

### 2. Supporting Libraries

Install supporting libraries:

```bash
pnpm add axios @tanstack/react-query
```

## File Structure

After setup, your project will have this structure:

```
oyrade-fe/
├── kubb.config.js              # Kubb configuration
├── lib/
│   ├── api-client/             # Generated code (auto-generated)
│   │   ├── index.ts           # Main exports
│   │   ├── types/             # TypeScript type definitions
│   │   ├── client/            # Axios API client functions
│   │   ├── hooks/             # React Query hooks
│   │   └── schemas/           # JSON schemas
│   └── kubb.ts                # API client configuration
├── scripts/
│   └── kubb/                  # Build scripts
│       ├── fix-openapi.js     # OpenAPI spec preprocessing
│       ├── fix-imports.js     # Post-generation import fixes
│       └── clean-temp.js      # Cleanup temporary files
└── docs/
    └── kubb/                  # Documentation
```

## Configuration

### 1. Environment Variables

Create `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:7777
```

### 2. Backend Requirements

Your NestJS backend needs to:

1. **Expose OpenAPI specification** at `/api-json`
2. **Enable CORS** for frontend domain
3. **Use complete Swagger decorators**

Example NestJS setup:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Oyrade API')
    .setDescription('API for Oyrade prediction market')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(7777);
}
```

## Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "generate:api": "node scripts/kubb/fix-openapi.js && kubb && node scripts/kubb/fix-imports.js && node scripts/kubb/clean-temp.js",
    "generate:api:dev": "node scripts/kubb/fix-openapi.js && kubb && node scripts/kubb/fix-imports.js"
  }
}
```

## Generation Process

### 1. OpenAPI Preprocessing (`fix-openapi.js`)

- Downloads OpenAPI spec from backend
- Fixes schema reference issues
- Saves temporary spec file

### 2. Code Generation (`kubb`)

- Reads OpenAPI specification
- Generates TypeScript types
- Creates Axios client functions
- Builds React Query hooks

### 3. Post-processing (`fix-imports.js`)

- Fixes import paths in generated files
- Ensures proper module resolution
- Adds missing type exports

### 4. Cleanup (`clean-temp.js`)

- Removes temporary files
- Cleans up build artifacts

## Generated Code Structure

### Types (`lib/api-client/types/`)

```typescript
// Example: market.ts
export interface Market {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface CreateMarketDto {
  title: string;
  description?: string;
}
```

### Client Functions (`lib/api-client/client/`)

```typescript
// Example: get-markets.ts
import type { Market } from '../types';

export async function getMarkets(
  options?: AxiosRequestConfig
): Promise<Market[]> {
  const response = await axios.get('/markets', options);
  return response.data;
}
```

### React Query Hooks (`lib/api-client/hooks/`)

```typescript
// Example: use-get-markets-query.ts
import { useQuery } from '@tanstack/react-query';
import { getMarkets } from '../client';

export function useGetMarketsQuery(options = {}) {
  return useQuery({
    queryKey: ['markets'],
    queryFn: () => getMarkets(options.client),
    ...options.query,
  });
}
```

## Usage

### Basic Usage

```tsx
import { useGetMarketsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';

export function MarketsList() {
  const { data, isLoading, error } = useGetMarketsQuery($);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.map(market => (
        <div key={market.id}>{market.title}</div>
      ))}
    </div>
  );
}
```

### Mutations

```tsx
import { useCreateMarketMutation } from '@/lib/api-client';
import { $ } from '@/lib/kubb';

export function CreateMarketForm() {
  const createMutation = useCreateMarketMutation($);
  
  const handleSubmit = async (data: CreateMarketDto) => {
    await createMutation.mutateAsync(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Troubleshooting

### Common Issues

1. **OpenAPI fetch fails**
   - Check backend is running
   - Verify CORS configuration
   - Check API URL in environment variables

2. **Generation fails**
   - Validate OpenAPI specification
   - Check for circular references in schemas
   - Ensure complete response types in NestJS routes

3. **Import errors**
   - Run `pnpm run generate:api` to fix imports
   - Check TypeScript configuration
   - Verify all dependencies are installed

### Debug Commands

```bash
# Test API connection
curl http://localhost:7777/api-json | jq

# Generate with verbose output
DEBUG=kubb* pnpm run generate:api

# Check generated files
ls -la lib/api-client/
```

## Best Practices

1. **Regular regeneration**: Run after every backend API change
2. **Version control**: Commit generated code for team synchronization
3. **Environment separation**: Use different API URLs for dev/staging/prod
4. **Error handling**: Always handle loading and error states
5. **Type safety**: Use generated types throughout the application

## Next Steps

See [Usage Guide](./usage.md) for detailed examples of using the generated API code in your components.
