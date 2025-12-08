# TanStack Query Implementation Plan

## Overview
Replace polling-based refresh with reactive state management that only updates when data actually changes.

## Why TanStack Query?

### Current Issues with Apollo Client Only
- No built-in optimistic updates
- Complex cache invalidation
- Harder to track what data is stale
- Less predictable refetching behavior

### TanStack Query Benefits
✅ **Automatic Cache Invalidation** - Mark queries as stale when mutations occur
✅ **Optimistic Updates** - Update UI immediately before server responds
✅ **Window Focus Refetching** - Refetch when user returns to tab
✅ **Mutation Tracking** - Know exactly when data changes
✅ **Better DevTools** - Visualize all queries and their states
✅ **Predictable Behavior** - Clear rules for when to refetch

## Implementation Options

### Option 1: Hybrid Approach (Recommended)
Keep Apollo Client for GraphQL, add TanStack Query for state management.

**Pros:**
- Minimal refactoring
- Keep existing Apollo setup
- Best of both worlds
- Gradual migration possible

**Cons:**
- Two query systems to maintain
- Slightly more complex architecture

### Option 2: Full TanStack Query Migration
Replace Apollo Client entirely with TanStack Query + graphql-request.

**Pros:**
- Single source of truth
- Simpler architecture
- Better performance
- Superior DevTools

**Cons:**
- Major refactoring required
- Need to rewrite all queries/mutations
- More upfront work

### Option 3: Apollo with Subscriptions
Keep Apollo, add GraphQL subscriptions for real-time updates.

**Pros:**
- Real-time updates
- Keep existing code
- WebSocket-based

**Cons:**
- Requires backend WebSocket support
- More server resources
- Complex error handling

## Recommended: Hybrid Approach

Let's implement TanStack Query alongside Apollo for intelligent cache invalidation.

---

## Step-by-Step Implementation

### Phase 1: Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Phase 2: Setup TanStack Query Provider

Create `src/lib/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

Update `src/components/Providers.tsx`:

```typescript
'use client';

import { ApolloProvider } from '@apollo/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { apolloClient } from '../lib/apollo';
import { queryClient } from '../lib/queryClient';
import { store } from '../store';
import { FeedbackButton } from './FeedbackButton';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          {children}
          <FeedbackButton />
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </ApolloProvider>
      </QueryClientProvider>
    </Provider>
  );
}
```

### Phase 3: Create Query Keys

Create `src/lib/queryKeys.ts`:

```typescript
// Centralized query keys for cache invalidation
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  
  // Inventory
  inventory: {
    all: ['inventory'] as const,
    units: (filters?: { page?: number; search?: string }) =>
      [...queryKeys.inventory.all, 'units', filters] as const,
    unit: (id: string) => [...queryKeys.inventory.all, 'unit', id] as const,
  },
  
  // Locations
  locations: {
    all: ['locations'] as const,
    list: () => [...queryKeys.locations.all, 'list'] as const,
  },
  
  // Lots
  lots: {
    all: ['lots'] as const,
    list: () => [...queryKeys.lots.all, 'list'] as const,
  },
  
  // Drugs
  drugs: {
    all: ['drugs'] as const,
    search: (query: string) => [...queryKeys.drugs.all, 'search', query] as const,
  },
  
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    byUnit: (unitId: string) => [...queryKeys.transactions.all, 'unit', unitId] as const,
  },
  
  // User
  user: {
    all: ['user'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
    clinics: () => [...queryKeys.user.all, 'clinics'] as const,
  },
} as const;
```

### Phase 4: Create Custom Hooks

Create `src/hooks/useInventoryQuery.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import { queryKeys } from '@/lib/queryKeys';

const GET_UNITS = gql`
  query GetUnits($page: Int, $pageSize: Int, $search: String) {
    getUnits(page: $page, pageSize: $pageSize, search: $search) {
      units {
        unitId
        totalQuantity
        availableQuantity
        expiryDate
        optionalNotes
        drug {
          medicationName
          genericName
          strength
          strengthUnit
          ndcId
          form
        }
        lot {
          source
          location {
            locationId
            name
            temp
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

const CHECK_OUT_UNIT = gql`
  mutation CheckOutUnit($input: CheckOutInput!) {
    checkOutUnit(input: $input) {
      transactionId
      quantity
    }
  }
`;

// Query hook
export function useInventoryUnits(page = 1, pageSize = 20, search?: string) {
  return useQuery({
    queryKey: queryKeys.inventory.units({ page, pageSize, search }),
    queryFn: async () => {
      const { data } = await apolloClient.query({
        query: GET_UNITS,
        variables: { page, pageSize, search },
        fetchPolicy: 'network-only', // Always fresh for inventory
      });
      return data.getUnits;
    },
    staleTime: 1000 * 30, // Consider stale after 30 seconds
  });
}

// Mutation hook with automatic cache invalidation
export function useCheckoutUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { unitId: string; quantity: number; notes?: string }) => {
      const { data } = await apolloClient.mutate({
        mutation: CHECK_OUT_UNIT,
        variables: { input },
      });
      return data.checkOutUnit;
    },
    onSuccess: () => {
      // Invalidate and refetch inventory queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.inventory.all });
      
      // Snapshot the previous value
      const previousUnits = queryClient.getQueryData(queryKeys.inventory.units({}));
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.inventory.units({}), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          units: old.units.map((unit: any) =>
            unit.unitId === variables.unitId
              ? { ...unit, availableQuantity: unit.availableQuantity - variables.quantity }
              : unit
          ),
        };
      });
      
      // Return context with the previous value
      return { previousUnits };
    },
    // On error, roll back to previous value
    onError: (_err, _variables, context) => {
      if (context?.previousUnits) {
        queryClient.setQueryData(queryKeys.inventory.units({}), context.previousUnits);
      }
    },
  });
}
```

### Phase 5: Update Pages to Use Hooks

Update `src/app/inventory/page.tsx`:

```typescript
'use client';

import { useInventoryUnits, useCheckoutUnit } from '@/hooks/useInventoryQuery';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Use TanStack Query hook
  const { data, isLoading, error } = useInventoryUnits(page, 20, search);
  const checkoutMutation = useCheckoutUnit();
  
  const handleQuickCheckout = (unitId: string, quantity: number) => {
    checkoutMutation.mutate(
      { unitId, quantity, notes: 'Quick checkout' },
      {
        onSuccess: () => {
          toast({ title: 'Success', description: 'Unit checked out' });
        },
      }
    );
  };
  
  // Data is automatically refetched when:
  // 1. Window regains focus
  // 2. Network reconnects
  // 3. Any mutation invalidates this query
  // 4. Data becomes stale (after 30 seconds)
  
  return (
    // ... rest of component
  );
}
```

### Phase 6: Global Mutation Tracking

Create `src/hooks/useMutationObserver.ts`:

```typescript
import { useEffect } from 'react';
import { useQueryClient, useIsMutating } from '@tanstack/react-query';

/**
 * Hook to track when any mutation is happening globally
 * Can be used to show global loading indicators or sync state
 */
export function useMutationObserver() {
  const queryClient = useQueryClient();
  const isMutating = useIsMutating();
  
  useEffect(() => {
    // Subscribe to mutation events
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.mutation.state.status === 'success') {
        console.log('Mutation succeeded:', event.mutation.options.mutationKey);
        
        // You can dispatch Redux actions here to sync state
        // or trigger other side effects
      }
    });
    
    return unsubscribe;
  }, [queryClient]);
  
  return { isMutating };
}
```

---

## Data Flow Architecture

### Before (Polling):
```
Timer (30s) → Fetch Data → Update Cache → Re-render
```

### After (Reactive):
```
User Action → Mutation → Success → Invalidate Queries → Auto Refetch → Re-render
Window Focus → Check Stale → Refetch if needed → Re-render
```

---

## Migration Strategy

### Week 1: Setup
- [ ] Install TanStack Query
- [ ] Setup providers and query client
- [ ] Add query keys
- [ ] Install DevTools

### Week 2: High-Traffic Pages
- [ ] Migrate Dashboard (home page)
- [ ] Migrate Inventory page
- [ ] Test cache invalidation

### Week 3: Mutations
- [ ] Migrate Check In mutations
- [ ] Migrate Check Out mutations
- [ ] Add optimistic updates

### Week 4: Remaining Pages
- [ ] Migrate Reports page
- [ ] Migrate Admin page
- [ ] Migrate Settings page

### Week 5: Polish
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Performance testing
- [ ] Remove old Apollo code (optional)

---

## Key Benefits You'll Get

### 1. Smart Refetching
```typescript
// Automatically refetches when window regains focus
// User switches tabs, data stays fresh
```

### 2. Optimistic Updates
```typescript
// UI updates immediately, rolls back on error
checkoutMutation.mutate(input, {
  onMutate: (variables) => {
    // Update UI immediately
  },
  onError: (error, variables, context) => {
    // Roll back on error
  },
});
```

### 3. Precise Cache Invalidation
```typescript
// Only refetch related queries
queryClient.invalidateQueries({ 
  queryKey: queryKeys.inventory.all 
});
```

### 4. Developer Experience
```typescript
// Beautiful DevTools showing all queries
// See what's stale, what's fetching, what's cached
```

### 5. Type Safety
```typescript
// Full TypeScript support
// Auto-completion for query keys
```

---

## Alternative: GraphQL Subscriptions

If you want **real-time** updates instead of smart refetching:

### Setup WebSocket on Backend

```typescript
// server/index.ts
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

useServer({ schema }, wsServer);
```

### Add Subscription to Schema

```typescript
// server/graphql/schema.ts
const typeDefs = `#graphql
  type Subscription {
    unitUpdated(clinicId: ID!): Unit
    transactionCreated(clinicId: ID!): Transaction
  }
`;
```

### Subscribe in Client

```typescript
import { useSubscription, gql } from '@apollo/client';

const UNIT_UPDATED = gql`
  subscription OnUnitUpdated($clinicId: ID!) {
    unitUpdated(clinicId: $clinicId) {
      unitId
      availableQuantity
    }
  }
`;

function InventoryPage() {
  useSubscription(UNIT_UPDATED, {
    variables: { clinicId },
    onData: ({ data }) => {
      // Automatically update UI when data changes
      console.log('Unit updated in real-time:', data);
    },
  });
}
```

**Pros:** True real-time updates
**Cons:** Requires WebSocket infrastructure, more complex

---

## Recommendation

Start with **Hybrid TanStack Query approach**:

1. **Phase 1 (Now):** Install TanStack Query, setup providers
2. **Phase 2 (This week):** Migrate Dashboard and Inventory pages
3. **Phase 3 (Next week):** Add optimistic updates for mutations
4. **Phase 4 (Later):** Evaluate if you need real-time subscriptions

This gives you:
- ✅ No more polling
- ✅ Data updates when it actually changes
- ✅ Better UX with optimistic updates
- ✅ Window focus refetching
- ✅ Predictable cache behavior
- ✅ Amazing DevTools

---

## Next Steps

Would you like me to:
1. **Implement the hybrid approach** (TanStack Query + Apollo)
2. **Add GraphQL subscriptions** for real-time updates
3. **Fully migrate to TanStack Query** (remove Apollo)

Let me know which direction you prefer!
