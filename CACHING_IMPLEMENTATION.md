# Caching Implementation

## Overview
This document explains the caching strategy implemented to eliminate loading screens between pages and optimize data fetching.

## Problem
Previously, the application was showing loading screens on every page navigation because:
1. Apollo Client was configured with `fetchPolicy: 'cache-and-network'`, causing network requests even when data was cached
2. `AppInitializer` was using `fetchPolicy: 'network-only'`, completely bypassing the cache
3. Pages were showing loading states even when cached data was available

## Solution

### 1. Apollo Client Configuration (`src/lib/apollo.ts`)

Changed the default fetch policy to `cache-first`:

```typescript
defaultOptions: {
  watchQuery: {
    fetchPolicy: 'cache-first', // Use cache first, only fetch if not cached
    nextFetchPolicy: 'cache-first', // Keep using cache after initial fetch
  },
  query: {
    fetchPolicy: 'cache-first', // Use cache for all queries
    errorPolicy: 'all',
  },
}
```

Added cache type policies for proper merging:
```typescript
cache: new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        getUnits: { merge(existing, incoming) { return incoming; } },
        getDashboardStats: { merge(existing, incoming) { return incoming; } },
      },
    },
  },
})
```

### 2. AppInitializer Optimization (`src/components/AppInitializer.tsx`)

- Changed from `network-only` to `cache-first` fetch policy
- Added cache check before fetching data
- If data is already cached, skip the loading screen entirely
- Only show loading screen on initial data fetch

```typescript
// Check if data is already in cache
const cachedPrefetchData = apolloClient.readQuery({ query: PREFETCH_DATA });
const cachedClinicsData = apolloClient.readQuery({ query: GET_USER_CLINICS });

// If both queries are cached, skip loading and initialize immediately
if (cachedPrefetchData && cachedClinicsData) {
  console.log('Using cached data, skipping initialization fetch');
  setIsInitialized(true);
  return;
}
```

### 3. Background Refresh Hook (`src/hooks/useBackgroundRefresh.ts`)

Created a new hook that silently refreshes data in the background without showing loading screens:

- Refreshes data every 30 seconds by default (configurable)
- Uses `network-only` policy to force refresh
- Doesn't trigger loading states in the UI
- Keeps data fresh without interrupting user experience

```typescript
useBackgroundRefresh(enabled, intervalMs)
```

Integrated into `AppShell` to run globally when user is authenticated.

### 4. Page-Level Optimizations

Updated pages to only show loading states when no data is available:

**Before:**
```typescript
{loading ? <Loader /> : <Content />}
```

**After:**
```typescript
{loading && !data ? <Loader /> : <Content />}
```

This prevents the flash of loading state when navigating with cached data.

## How It Works

### First Visit Flow
1. User logs in
2. `AppInitializer` shows loading screen
3. Essential data is fetched and cached
4. User sees the app

### Subsequent Navigation
1. User navigates to a page
2. Apollo Client checks cache first
3. **If data exists in cache**: Instantly displays cached data (no loading screen)
4. **If data doesn't exist**: Shows loading state while fetching

### Background Updates
1. Every 30 seconds, data is silently refreshed in the background
2. Cache is updated with fresh data
3. UI reactively updates when data changes
4. No loading screens shown during refresh

## Benefits

1. **Instant Navigation**: No loading screens between pages after initial load
2. **Fresh Data**: Background refresh keeps data up-to-date
3. **Better UX**: Seamless navigation without interruptions
4. **Reduced Network Requests**: Only fetch data that's not cached
5. **Optimistic UI**: Show data immediately, update if needed

## Configuration

### Adjust Background Refresh Interval

In `src/components/layout/AppShell.tsx`:

```typescript
// Refresh every 30 seconds (default)
useBackgroundRefresh(isAuthenticated, 30000);

// Refresh every 60 seconds
useBackgroundRefresh(isAuthenticated, 60000);

// Disable background refresh
useBackgroundRefresh(false);
```

### Force Refetch for Specific Queries

If you need to force a refetch for a specific query:

```typescript
const { data, loading, refetch } = useQuery(MY_QUERY);

// Force refetch
await refetch();
```

### Clear Cache

To clear the Apollo cache:

```typescript
import { apolloClient } from '@/lib/apollo';

// Clear entire cache
await apolloClient.clearStore();

// Reset cache (clears and refetches active queries)
await apolloClient.resetStore();
```

## Mutations and Cache Updates

Mutations automatically refetch specified queries:

```typescript
const [createUnit] = useMutation(CREATE_UNIT, {
  refetchQueries: ['GetDashboardStats', 'GetUnits'],
  // ...
});
```

These refetches will update the cache, and all components using that data will automatically re-render with fresh data.

## Testing

To test the caching behavior:

1. Open the app and navigate to a few pages
2. Check the Network tab in DevTools - you should see initial requests
3. Navigate back to a previously visited page
4. **You should NOT see new network requests** (data loaded from cache)
5. Wait 30 seconds and check Network tab - you should see background refresh requests
6. The UI should update automatically without loading screens

## Future Improvements

1. **Normalized Cache**: Implement normalized caching for entities (e.g., by ID)
2. **Optimistic Updates**: Update UI immediately on mutations before server responds
3. **Pagination Caching**: Cache paginated results for better navigation
4. **Selective Background Refresh**: Only refresh data for the current page
5. **Network-Aware Refresh**: Adjust refresh rate based on network conditions
6. **Cache Persistence**: Persist cache to localStorage for offline support

## Troubleshooting

### Data Not Updating After Mutation
- Check that mutation includes proper `refetchQueries`
- Verify cache type policies are configured correctly
- Try using `awaitRefetchQueries: true` in mutation options

### Loading Screen Still Showing
- Verify page is checking `loading && !data` instead of just `loading`
- Check that query is using default `cache-first` policy
- Ensure `AppInitializer` cache check is working

### Background Refresh Not Working
- Check browser console for errors
- Verify `useBackgroundRefresh` is called in `AppShell`
- Ensure user is authenticated (refresh only runs when authenticated)
