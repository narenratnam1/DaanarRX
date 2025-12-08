# Reactive State Management Plan

## Current Implementation

### ✅ What's Working
- **Cache-first fetching** - Data loads from cache instantly
- **No loading screens** - Pages display cached data immediately
- **Apollo Client** - GraphQL queries and mutations work

### ❌ What's Missing
- **No awareness of data changes** - App doesn't know when DB updates
- **No optimistic updates** - UI waits for server response
- **No automatic invalidation** - Cache doesn't know when it's stale
- **No window focus refetching** - Data can be stale when user returns
- **Manual cache management** - Have to remember to refetch specific queries

## The Problem

Currently, when data changes:
1. User performs action (e.g., checks out medication)
2. Mutation succeeds
3. We manually specify `refetchQueries: ['GetUnits', 'GetDashboardStats']`
4. Hope we remembered all affected queries
5. User might see stale data if we missed something

**We need the app to be AWARE of data changes and react automatically.**

---

## Solution: TanStack Query

### Why TanStack Query?

**Smart Cache Invalidation:**
```typescript
// When you checkout a unit, automatically invalidate:
// - All inventory queries
// - Dashboard stats
// - Transaction history
// - Related reports
queryClient.invalidateQueries({ queryKey: ['inventory'] });
```

**Optimistic Updates:**
```typescript
// Update UI immediately, rollback on error
onMutate: async (variables) => {
  // UI shows updated quantity instantly
  // If error occurs, automatically rolls back
}
```

**Window Focus Refetching:**
```typescript
// User switches tabs, comes back
// Data automatically refetches if stale
refetchOnWindowFocus: true
```

**Mutation Awareness:**
```typescript
// Know exactly when data is changing
const isMutating = useIsMutating();
// Show global loading indicator
// Sync with Redux
// Track changes
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅ READY TO START

**Goal:** Setup TanStack Query alongside Apollo

**Tasks:**
- Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- Create `src/lib/queryClient.ts` with configuration
- Update `Providers.tsx` to wrap with QueryClientProvider
- Add React Query DevTools for debugging
- Create `src/lib/queryKeys.ts` for centralized cache keys

**Files to create:**
- `src/lib/queryClient.ts`
- `src/lib/queryKeys.ts`

**Files to modify:**
- `src/components/Providers.tsx`

**Testing:**
- DevTools appear in browser
- No errors in console
- App still works as before

### Phase 2: Dashboard Migration (Week 1)

**Goal:** Migrate home page to use TanStack Query

**Tasks:**
- Create `src/hooks/useDashboardQuery.ts`
- Implement `useDashboardStats()` hook
- Update `src/app/page.tsx` to use new hook
- Test window focus refetching
- Verify cache works

**Benefits:**
- Dashboard automatically refetches when window gains focus
- Data stays fresh without polling
- Can see query state in DevTools

### Phase 3: Inventory Migration (Week 2)

**Goal:** Migrate inventory page with smart invalidation

**Tasks:**
- Create `src/hooks/useInventoryQuery.ts`
- Implement `useInventoryUnits()` hook
- Implement `useCheckoutUnit()` mutation with cache invalidation
- Update `src/app/inventory/page.tsx`
- Test that checkout invalidates inventory and dashboard

**Benefits:**
- Inventory updates automatically after mutations
- Dashboard stats update when inventory changes
- No manual refetchQueries needed

### Phase 4: Check-In/Check-Out (Week 2-3)

**Goal:** Add optimistic updates to mutations

**Tasks:**
- Create `src/hooks/useCheckInMutation.ts`
- Create `src/hooks/useCheckOutMutation.ts`
- Implement optimistic updates
- Add rollback on error
- Test with slow network

**Benefits:**
- UI updates instantly
- Better UX
- Automatic rollback on errors
- Users see immediate feedback

### Phase 5: Global State Sync (Week 3)

**Goal:** Connect TanStack Query with Redux

**Tasks:**
- Create `src/hooks/useMutationObserver.ts`
- Sync mutation states with Redux
- Show global loading indicator when mutating
- Update Redux when queries succeed
- Keep both in sync

**Benefits:**
- Single source of truth
- Redux and TanStack work together
- Global awareness of data changes

### Phase 6: Remaining Pages (Week 4)

**Goal:** Migrate all pages

**Tasks:**
- Reports page
- Admin page
- Settings page
- Scan page

**Benefits:**
- Consistent behavior across app
- All pages benefit from smart caching

---

## Code Examples

### Before (Apollo Only)

```typescript
// Inventory page
const { data, loading } = useQuery(GET_UNITS);

const [checkOutUnit] = useMutation(CHECK_OUT_UNIT, {
  refetchQueries: ['GetUnits', 'GetDashboardStats'], // Easy to forget
  onCompleted: () => {
    toast({ title: 'Success' });
  },
});

// Problems:
// ❌ Might forget to refetch some queries
// ❌ No optimistic updates
// ❌ Loading states are complex
// ❌ No window focus refetching
```

### After (TanStack Query + Apollo)

```typescript
// Inventory page
const { data, isLoading } = useInventoryUnits(page, search);
const checkoutMutation = useCheckoutUnit();

const handleCheckout = (unitId: string, quantity: number) => {
  checkoutMutation.mutate({ unitId, quantity });
  // UI updates immediately (optimistic)
  // Automatically invalidates ALL related queries
  // Rolls back on error
};

// Benefits:
// ✅ Automatic cache invalidation
// ✅ Optimistic updates
// ✅ Window focus refetching
// ✅ Better loading states
// ✅ Type-safe
```

---

## Data Change Awareness

### How App Knows When Data Changes:

#### 1. Mutations
```typescript
// User performs action
checkoutMutation.mutate(input);

// TanStack Query automatically:
// 1. Marks affected queries as stale
// 2. Invalidates cache entries
// 3. Refetches active queries
// 4. Updates UI
```

#### 2. Window Focus
```typescript
// User switches tabs, comes back
// TanStack Query checks: Is data stale?
// If yes → refetch automatically
// If no → use cache
```

#### 3. Network Reconnection
```typescript
// Internet drops, reconnects
// TanStack Query automatically refetches
refetchOnReconnect: true
```

#### 4. Manual Invalidation
```typescript
// Explicit invalidation when needed
queryClient.invalidateQueries({ queryKey: ['inventory'] });
```

#### 5. Time-based Staleness
```typescript
// Data becomes stale after 30 seconds
staleTime: 30000
// Automatic refetch on next access
```

---

## Benefits Over Polling

### Polling (Old Approach)
```
❌ Fetches every 30s whether data changed or not
❌ Wastes network bandwidth
❌ Wastes server resources
❌ Can miss updates between polls
❌ Always 30s behind max
```

### TanStack Query (New Approach)
```
✅ Only fetches when data might have changed
✅ Minimal network usage
✅ Efficient server usage
✅ Immediate updates on mutations
✅ Always up-to-date
```

---

## DevTools

TanStack Query includes amazing DevTools:

```typescript
<ReactQueryDevtools initialIsOpen={false} />
```

**Features:**
- See all queries and their states (fresh, stale, fetching)
- See all mutations and their states
- Inspect cache contents
- Manually trigger refetches
- See query dependencies
- Debug cache invalidation

**Much better than Apollo DevTools!**

---

## Alternative: GraphQL Subscriptions

If you need **real-time** updates (multiple users editing simultaneously):

### Pros
- True real-time updates
- Server pushes changes
- No polling or checking

### Cons
- Requires WebSocket infrastructure
- More complex backend
- More server resources
- Harder to debug

### When to use
- Multiple users editing same data
- Live dashboards
- Chat features
- Collaborative editing

### When NOT to use
- Single-user actions
- Not needed for most CRUD apps
- TanStack Query is usually sufficient

---

## Recommendation

**Start with TanStack Query (Phases 1-6)**

This gives you:
- ✅ Awareness of data changes
- ✅ Optimistic updates
- ✅ Smart cache invalidation
- ✅ Window focus refetching
- ✅ Better DevTools
- ✅ Type safety

**Only add subscriptions if:**
- Multiple users editing simultaneously
- Need instant updates across sessions
- Have real-time requirements

For DaanarRX (medication tracking), TanStack Query is perfect because:
- Single user typically performs actions
- Window focus refetching keeps data fresh
- Optimistic updates provide instant feedback
- Cache invalidation handles related data
- Much simpler than subscriptions

---

## Next Action

Ready to implement? I can:

1. **Install dependencies and setup (Phase 1)** ← Start here
2. **Migrate Dashboard page (Phase 2)**
3. **Migrate Inventory with optimistic updates (Phase 3)**

This gives you proper data change awareness without polling, using industry best practices.

Which phase would you like me to implement first?
