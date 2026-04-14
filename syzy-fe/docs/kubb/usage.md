# Kubb Usage Guide - Oyrade Frontend

Comprehensive guide on how to effectively use the generated API code in your React components.

## Basic Usage Patterns

### 1. Simple Data Fetching

```tsx
import { useGetMarketsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';

export function MarketsList() {
  const { data, isLoading, error } = useGetMarketsQuery($);
  
  if (isLoading) return <div>Loading markets...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Markets ({data?.length || 0})</h2>
      <ul>
        {data?.map(market => (
          <li key={market.id}>
            <strong>{market.title}</strong>
            {market.description && <p>{market.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. Data Mutations

```tsx
import { useCreateMarketMutation } from '@/lib/api-client';
import { $ } from '@/lib/kubb';
import { useState } from 'react';

export function CreateMarketForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const createMutation = useCreateMarketMutation($);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMutation.mutateAsync({
        title,
        description: description || undefined,
      });
      
      // Reset form
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create market:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title:</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Market'}
      </button>
    </form>
  );
}
```

## Configuration Options

### Query Configurations

The `@/lib/kubb` module provides several pre-configured options:

#### Standard Configuration (`$`)
Best for most use cases - balances performance with data freshness:

```tsx
import { useGetMarketsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';

// 5-minute cache, refetch on reconnect
const { data } = useGetMarketsQuery($);
```

#### Live Data Configuration (`$live`)
For real-time data that needs frequent updates:

```tsx
import { useGetMarketStatsQuery } from '@/lib/api-client';
import { $live } from '@/lib/kubb';

// Refetches every 30 seconds
const { data } = useGetMarketStatsQuery($live);
```

#### Fresh Data Configuration (`$fresh`)
For critical data that must always be current:

```tsx
import { useGetUserProfileQuery } from '@/lib/api-client';
import { $fresh } from '@/lib/kubb';

// Always refetches, no caching
const { data } = useGetUserProfileQuery($fresh);
```

#### Background Data Configuration (`$background`)
For non-critical data with minimal refetching:

```tsx
import { useGetAppConfigQuery } from '@/lib/api-client';
import { $background } from '@/lib/kubb';

// 15-minute cache, no automatic refetching
const { data } = useGetAppConfigQuery($background);
```

### Custom Configuration

You can also create custom configurations:

```tsx
import { useGetMarketsQuery } from '@/lib/api-client';
import { withAuth } from '@/lib/kubb';

const customConfig = {
  ...withAuth,
  query: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
  },
};

const { data } = useGetMarketsQuery(customConfig);
```

## Advanced Usage Patterns

### 1. Dependent Queries

```tsx
import { useGetMarketQuery, useGetMarketCommentsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';

export function MarketDetails({ marketId }: { marketId: string }) {
  // First query
  const { data: market, isLoading: marketLoading } = useGetMarketQuery({
    ...$,
    path: { marketId },
  });
  
  // Dependent query - only runs when market is loaded
  const { data: comments, isLoading: commentsLoading } = useGetMarketCommentsQuery({
    ...$,
    path: { marketId },
  }, {
    enabled: !!market, // Only run when market exists
  });
  
  if (marketLoading) return <div>Loading market...</div>;
  if (!market) return <div>Market not found</div>;
  
  return (
    <div>
      <h1>{market.title}</h1>
      <p>{market.description}</p>
      
      {commentsLoading ? (
        <div>Loading comments...</div>
      ) : (
        <div>
          <h2>Comments ({comments?.length || 0})</h2>
          {/* Render comments */}
        </div>
      )}
    </div>
  );
}
```

### 2. Optimistic Updates

```tsx
import { useUpdateMarketMutation, useGetMarketsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';
import { useQueryClient } from '@tanstack/react-query';
import type { Market } from '@/lib/api-client/types';

export function MarketEditor({ market }: { market: Market }) {
  const queryClient = useQueryClient();
  
  const updateMutation = useUpdateMarketMutation({
    ...$,
    mutation: {
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ['markets'] });
        
        // Snapshot previous value
        const previousMarkets = queryClient.getQueryData(['markets']);
        
        // Optimistically update
        queryClient.setQueryData(['markets'], (old: Market[]) =>
          old?.map(m => m.id === market.id ? { ...m, ...variables } : m)
        );
        
        return { previousMarkets };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousMarkets) {
          queryClient.setQueryData(['markets'], context.previousMarkets);
        }
      },
      onSettled: () => {
        // Refetch after mutation
        queryClient.invalidateQueries({ queryKey: ['markets'] });
      },
    },
  });
  
  const handleUpdate = (updates: Partial<Market>) => {
    updateMutation.mutate({
      ...updates,
      marketId: market.id,
    });
  };
  
  return (
    <div>
      {/* Your edit form */}
    </div>
  );
}
```

### 3. Pagination

For paginated data:

```tsx
import { useGetMarketsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';
import { useState } from 'react';

export function PaginatedMarketsList() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const { data, isLoading, isFetching } = useGetMarketsQuery({
    ...$,
    query: {
      page,
      limit,
    },
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data?.items.map(market => (
        <div key={market.id}>{market.title}</div>
      ))}
      
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || isFetching}
        >
          Previous
        </button>
        
        <span>Page {page} of {data?.totalPages}</span>
        
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.hasMore || isFetching}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Error Handling

### 1. Component-Level Error Handling

```tsx
import { useGetMarketsQuery } from '@/lib/api-client';
import { $ } from '@/lib/kubb';
import { AxiosError } from 'axios';

export function MarketsWithErrorHandling() {
  const { data, isLoading, error } = useGetMarketsQuery($);
  
  if (isLoading) return <div>Loading...</div>;
  
  if (error) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response?.status === 404) {
      return <div>No markets found</div>;
    }
    
    if (axiosError.response?.status === 401) {
      return <div>Please log in to view markets</div>;
    }
    
    return <div>Error loading markets: {error.message}</div>;
  }
  
  return (
    <div>
      {/* Render markets */}
    </div>
  );
}
```

### 2. Global Error Handling

```tsx
// In your app root or query client setup
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error);
        toast.error('Failed to fetch data');
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        toast.error('Failed to save changes');
      },
    },
  },
});
```

## Direct API Calls

Sometimes you need to make direct API calls outside of React components:

```tsx
import { getMarkets, createMarket } from '@/lib/api-client/client';
import { withAuth } from '@/lib/kubb';

// In a utility function or server action
export async function processMarkets() {
  try {
    // Fetch markets
    const markets = await getMarkets(withAuth);
    
    // Create new market
    const newMarket = await createMarket({
      ...withAuth,
      data: {
        title: 'New Market',
        description: 'Created programmatically',
      },
    });
    
    return { markets, newMarket };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Type Safety

### Using Generated Types

```tsx
import type { Market, CreateMarketDto } from '@/lib/api-client/types';

// Type-safe component props
interface MarketCardProps {
  market: Market;
  onUpdate: (updates: Partial<Market>) => void;
}

export function MarketCard({ market, onUpdate }: MarketCardProps) {
  const handleTitleChange = (title: string) => {
    // TypeScript ensures this matches Market interface
    onUpdate({ title });
  };
  
  return (
    <div>
      <input
        value={market.title}
        onChange={(e) => handleTitleChange(e.target.value)}
      />
    </div>
  );
}

// Type-safe form handling
export function useMarketForm() {
  const [formData, setFormData] = useState<CreateMarketDto>({
    title: '',
    description: undefined,
  });
  
  // TypeScript will catch any type mismatches
  const updateField = <K extends keyof CreateMarketDto>(
    field: K,
    value: CreateMarketDto[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return { formData, updateField };
}
```

## Authentication

### Setting Auth Token

```tsx
import { setAuthToken } from '@/lib/kubb';

// After successful login
export function LoginForm() {
  const handleLogin = async (credentials) => {
    const response = await login(credentials);
    
    // Set token for future requests
    setAuthToken(response.token);
    
    // Redirect to dashboard
    router.push('/dashboard');
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* login form */}
    </form>
  );
}
```

### Clearing Auth Token

```tsx
import { setAuthToken } from '@/lib/kubb';

export function LogoutButton() {
  const handleLogout = () => {
    // Clear token
    setAuthToken(null);
    
    // Redirect to login
    router.push('/login');
  };
  
  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

## Performance Optimization

### 1. Query Key Management

```tsx
// Create consistent query keys
export const marketKeys = {
  all: ['markets'] as const,
  lists: () => [...marketKeys.all, 'list'] as const,
  list: (filters: string) => [...marketKeys.lists(), { filters }] as const,
  details: () => [...marketKeys.all, 'detail'] as const,
  detail: (id: string) => [...marketKeys.details(), id] as const,
};

// Use in components
const { data } = useGetMarketsQuery({
  ...$,
  queryKey: marketKeys.list('active'),
});
```

### 2. Selective Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query';

export function useMarketActions() {
  const queryClient = useQueryClient();
  
  const invalidateMarkets = () => {
    queryClient.invalidateQueries({ queryKey: marketKeys.all });
  };
  
  const invalidateMarket = (id: string) => {
    queryClient.invalidateQueries({ queryKey: marketKeys.detail(id) });
  };
  
  return { invalidateMarkets, invalidateMarket };
}
```

## Testing

### Mock API Responses

```tsx
// In your test files
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/markets', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', title: 'Test Market', description: 'Test description' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarketsList } from './MarketsList';

test('renders markets list', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  render(
    <QueryClientProvider client={queryClient}>
      <MarketsList />
    </QueryClientProvider>
  );
  
  expect(await screen.findByText('Test Market')).toBeInTheDocument();
});
```

## Best Practices

1. **Use appropriate configurations**: Choose the right caching strategy for your data
2. **Handle loading and error states**: Always provide feedback to users
3. **Leverage TypeScript**: Use generated types for type safety
4. **Optimize queries**: Use query keys and selective invalidation
5. **Test your components**: Mock API responses for reliable tests
6. **Monitor performance**: Use React Query DevTools in development

## Common Patterns

### Real-time Dashboard

```tsx
import { useGetMarketStatsQuery } from '@/lib/api-client';
import { $live } from '@/lib/kubb';

export function MarketDashboard() {
  const { data: stats } = useGetMarketStatsQuery($live);
  
  return (
    <div className="dashboard">
      <div className="metric">
        <h3>Total Volume</h3>
        <span>${stats?.totalVolume}</span>
      </div>
      <div className="metric">
        <h3>Active Markets</h3>
        <span>{stats?.activeMarkets}</span>
      </div>
    </div>
  );
}
```

### Form with Validation

```tsx
import { useCreateMarketMutation } from '@/lib/api-client';
import { $ } from '@/lib/kubb';
import { useForm } from 'react-hook-form';
import type { CreateMarketDto } from '@/lib/api-client/types';

export function MarketForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateMarketDto>();
  const createMutation = useCreateMarketMutation($);
  
  const onSubmit = (data: CreateMarketDto) => {
    createMutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('title', { required: 'Title is required' })}
        placeholder="Market title"
      />
      {errors.title && <span>{errors.title.message}</span>}
      
      <textarea
        {...register('description')}
        placeholder="Description (optional)"
      />
      
      <button type="submit" disabled={createMutation.isPending}>
        Create Market
      </button>
    </form>
  );
}
```

This comprehensive usage guide should help you effectively use the generated API code in various scenarios. Remember to regenerate your API code whenever your backend changes to keep everything in sync!
