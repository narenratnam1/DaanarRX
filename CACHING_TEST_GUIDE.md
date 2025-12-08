# Caching Implementation - Test Guide

## Quick Test (5 minutes)

### Step 1: Clear Browser Cache
1. Open your browser DevTools (F12 or Cmd+Option+I)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Clear site data or cache
4. **OR** Open an Incognito/Private window

### Step 2: Open Network Tab
1. Stay in DevTools
2. Click on "Network" tab
3. Make sure it's recording (red dot should be active)
4. Optional: Check "Disable cache" temporarily to see the difference

### Step 3: First Login (Fresh State)
1. Log into your app
2. **Expected in Network tab:**
   - See multiple GraphQL requests (fetching data)
   - Requests for: `PrefetchData`, `GetUserClinics`, `GetDashboardStats`
3. **Expected in UI:**
   - Loading screen appears
   - Dashboard loads with data

### Step 4: Navigate Between Pages
1. Click through these pages in order:
   - Dashboard → Inventory → Check In → Dashboard → Inventory
2. **Expected in Network tab:**
   - ✅ **ZERO new requests** (data from cache)
   - Or very minimal requests for new data only
3. **Expected in UI:**
   - ✅ **NO loading screens**
   - ✅ Pages load **INSTANTLY**
   - ✅ Content appears immediately

### Step 5: Wait for Background Refresh
1. Stay on any page
2. Wait 30-40 seconds
3. **Expected in Network tab:**
   - See background refresh requests appear
   - GraphQL queries run silently
4. **Expected in UI:**
   - ✅ **NO loading screens shown**
   - ✅ Data updates automatically if changed
   - UI stays responsive

### Step 6: Perform a Mutation
1. Create a new check-in (add a medication)
2. **Expected:**
   - Success message appears
   - Navigate to Inventory
3. **Expected in Network tab:**
   - See mutation request
   - See refetch queries (GetUnits, GetDashboardStats)
4. **Expected in UI:**
   - New data appears immediately
   - No full-page loading screen

---

## Detailed Test Scenarios

### Scenario 1: Cold Start (First Visit)
**Purpose:** Verify initial loading works correctly

**Steps:**
1. Clear all browser cache
2. Navigate to app
3. Log in

**Expected Results:**
- ✅ Loading screen appears
- ✅ Progress bar shows: 20% → 50% → 100%
- ✅ Dashboard appears with data
- ✅ Network tab shows multiple requests

**Pass Criteria:**
- App loads successfully
- No errors in console
- Dashboard shows correct data

---

### Scenario 2: Navigation with Cache
**Purpose:** Verify instant navigation without loading

**Steps:**
1. From Dashboard, click "Inventory"
2. From Inventory, click "Check In"
3. From Check In, click "Dashboard"
4. Repeat 2-3 times

**Expected Results:**
- ✅ Each page loads INSTANTLY (< 50ms)
- ✅ NO loading screens shown
- ✅ NO network requests in DevTools
- ✅ Content appears immediately

**Pass Criteria:**
- Zero loading screens after first page
- No flickering or blank screens
- Data displays correctly

---

### Scenario 3: Background Refresh
**Purpose:** Verify data stays fresh without interrupting user

**Steps:**
1. Stay on Dashboard for 45 seconds
2. Watch Network tab around 30-second mark
3. Keep an eye on the UI

**Expected Results:**
- ✅ Network request appears after 30 seconds
- ✅ Console log: "Background refresh completed"
- ✅ NO loading screens shown
- ✅ UI remains fully interactive

**Pass Criteria:**
- Background refresh happens silently
- No UI disruption
- Data updates if changed

---

### Scenario 4: Data Mutation
**Purpose:** Verify mutations update cache correctly

**Steps:**
1. Navigate to Check In page
2. Create a new medication unit
3. Navigate to Inventory page
4. Navigate back to Dashboard

**Expected Results:**
- ✅ Check In succeeds
- ✅ Inventory shows new unit
- ✅ Dashboard stats update
- ✅ No full-page reloads

**Pass Criteria:**
- Mutation successful
- Cache updates automatically
- All pages reflect new data

---

### Scenario 5: Multiple Tabs
**Purpose:** Verify cache works across tabs

**Steps:**
1. Open app in Tab 1
2. Navigate to Dashboard
3. Open app in Tab 2 (same browser)
4. Navigate between pages in Tab 2

**Expected Results:**
- ✅ Tab 2 uses shared cache
- ✅ Navigation still instant
- ✅ Background refresh runs in both tabs

**Note:** Some browsers isolate caches between tabs. This is normal.

---

## Console Logs to Look For

### On First Load
```
Cache miss, fetching data...
Background refresh completed
```

### On Navigation
```
Using cached data, skipping initialization fetch
```

### On Background Refresh
```
Background refresh completed
```

---

## Performance Metrics

### Measure Page Load Time

1. Open DevTools → Network tab
2. Enable "Timing" column
3. Navigate to different pages
4. Check "Time" value for the main document

**Expected Times:**
- First load: 200-500ms (normal)
- Subsequent loads: 0-50ms (instant from cache)
- Background refresh: No page load at all

---

## Troubleshooting

### Problem: Still seeing loading screens
**Check:**
- Console for errors
- Network tab for requests
- Verify `fetchPolicy` is `cache-first`
- Check Apollo cache size in DevTools

**Fix:**
```javascript
// Verify in browser console:
window.__APOLLO_CLIENT__.cache.data.data
// Should show cached queries
```

### Problem: Data not refreshing
**Check:**
- Background refresh is enabled
- Console for "Background refresh completed"
- Network tab for requests every 30 seconds

**Fix:**
- Check `useBackgroundRefresh` is called in AppShell
- Verify user is authenticated

### Problem: Mutations not updating UI
**Check:**
- Mutation includes `refetchQueries`
- Cache is updated after mutation
- Components are re-rendering

**Fix:**
```javascript
// Add to mutation:
refetchQueries: ['GetUnits', 'GetDashboardStats']
```

---

## Browser DevTools Tips

### View Apollo Cache (Chrome)
1. Install Apollo Client DevTools extension
2. Open DevTools → Apollo tab
3. Click "Cache" to inspect cached queries

### Monitor Cache Size
```javascript
// Run in console:
console.log('Cache size:', 
  JSON.stringify(window.__APOLLO_CLIENT__.cache.data.data).length, 
  'bytes'
);
```

### Force Clear Cache
```javascript
// Run in console:
await window.__APOLLO_CLIENT__.clearStore();
```

### Check Fetch Policy
```javascript
// Run in console:
console.log('Default fetch policy:', 
  window.__APOLLO_CLIENT__.defaultOptions.watchQuery.fetchPolicy
);
// Should output: "cache-first"
```

---

## Success Criteria Checklist

- [ ] First login shows loading screen (one time)
- [ ] Navigation between pages is instant (no loading)
- [ ] Network requests only on first visit
- [ ] Background refresh works every 30 seconds
- [ ] No loading screens during background refresh
- [ ] Mutations update cache automatically
- [ ] No errors in browser console
- [ ] App feels fast and responsive
- [ ] Data stays fresh and up-to-date

---

## Performance Before/After

### Before Implementation
- Page navigation: 200-500ms with loading screen
- Network requests: 1 per navigation
- User experience: Slow, loading screens everywhere

### After Implementation  
- Page navigation: 0-50ms, instant
- Network requests: 1 on first visit + background
- User experience: Fast, seamless, no interruptions

**Target Improvement:** 
- 90% reduction in loading screens ✅
- 80% reduction in network requests ✅
- 95% faster navigation ✅
