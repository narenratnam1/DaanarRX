# Multi-Clinic Inventory & Reports Bug Fix

## 🔴 Problem Summary

When switching between clinics, the **Inventory** and **Reports** pages were not displaying clinic-specific data. Users could not see units or transactions that belonged to the currently selected clinic.

## 🔍 Root Cause Analysis

### Database Layer ✅ (Working Correctly)
- Units and transactions are **correctly tagged** with `clinic_id` during check-in and check-out
- RLS (Row Level Security) policies are **properly configured** to scope data by clinic
- The `current_user_clinic_ids()` function correctly returns all clinics a user has access to

### Application Layer ❌ (Bug Location)
The bug was in the **GraphQL queries** on the frontend:
1. **`getUnits` query** did not accept or pass `clinicId` parameter
2. **`getTransactions` query** did not accept or pass `clinicId` parameter
3. The resolvers relied solely on the auth context's primary clinic
4. When users switched clinics, the queries continued using the original clinic ID

## ✅ Solution Implemented

### 1. Updated GraphQL Schema (`server/graphql/schema.ts`)

**Before:**
```graphql
getUnits(page: Int, pageSize: Int, search: String): PaginatedUnits!
getTransactions(page: Int, pageSize: Int, search: String, unitId: ID): PaginatedTransactions!
```

**After:**
```graphql
getUnits(page: Int, pageSize: Int, search: String, clinicId: ID): PaginatedUnits!
getTransactions(page: Int, pageSize: Int, search: String, unitId: ID, clinicId: ID): PaginatedTransactions!
```

### 2. Updated Resolvers (`server/graphql/resolvers.ts`)

Added clinic access validation logic:
- Accept optional `clinicId` parameter
- If `clinicId` is provided, verify the user has access to that clinic
- Use the requested clinic ID instead of the auth context's default clinic
- Throw `FORBIDDEN` error if user doesn't have access

**Example resolver logic:**
```typescript
getUnits: async (_, { page, pageSize, search, clinicId }, context) => {
  const { user, clinic } = requireAuth(context);

  // If clinicId is provided, verify user has access to it
  const requestedClinicId = clinicId?.trim();
  if (!requestedClinicId || requestedClinicId === clinic.clinicId) {
    return unitService.getUnits(clinic.clinicId, page, pageSize, search);
  }

  // Verify the user can access the requested clinic
  const hasAccess = await verifyUserClinicAccess(user.userId, requestedClinicId);
  if (!hasAccess) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return unitService.getUnits(requestedClinicId, page, pageSize, search);
}
```

### 3. Updated Inventory Page (`src/app/inventory/page.tsx`)

**Changes:**
1. Extract `clinicId` from localStorage
2. Pass `clinicId` to the `GET_UNITS` query
3. Skip query execution if no clinic is selected
4. Also updated `GET_TRANSACTIONS` query for unit transaction history

**Before:**
```typescript
const { data, loading } = useQuery(GET_UNITS, {
  variables: { page, pageSize: 20, search: getSearchQuery() },
});
```

**After:**
```typescript
const clinicStr = typeof window !== 'undefined' ? localStorage.getItem('clinic') : null;
const clinicId = clinicStr ? (() => { 
  try { 
    return JSON.parse(clinicStr).clinicId as string | undefined; 
  } catch { 
    return undefined; 
  } 
})() : undefined;

const { data, loading } = useQuery(GET_UNITS, {
  variables: { page, pageSize: 20, search: getSearchQuery(), clinicId },
  skip: !clinicId,
});
```

### 4. Updated Reports Page (`src/app/reports/page.tsx`)

**Changes:**
1. Extract `clinicId` from localStorage
2. Pass `clinicId` to the `GET_TRANSACTIONS` query
3. Skip query execution if no clinic is selected

**Before:**
```typescript
const { data, loading } = useQuery(GET_TRANSACTIONS, {
  variables: { page, pageSize: 20, search: search || undefined },
});
```

**After:**
```typescript
const clinicStr = typeof window !== 'undefined' ? localStorage.getItem('clinic') : null;
const clinicId = clinicStr ? (() => { 
  try { 
    return JSON.parse(clinicStr).clinicId as string | undefined; 
  } catch { 
    return undefined; 
  } 
})() : undefined;

const { data, loading } = useQuery(GET_TRANSACTIONS, {
  variables: { page, pageSize: 20, search: search || undefined, clinicId },
  skip: !clinicId,
});
```

## 🧪 Testing Instructions

### Prerequisites
You need at least 2 clinics with data in each:
- **Clinic A**: Should have some units and transactions
- **Clinic B**: Should have different units and transactions

### Test Scenario 1: View Clinic A Inventory
1. Log in to the application
2. Switch to **Clinic A** using the clinic switcher
3. Navigate to **Inventory** page
4. **Expected Result:** You should see all units that belong to Clinic A
5. Click on a unit to view details
6. **Expected Result:** Transaction history should show transactions for Clinic A

### Test Scenario 2: View Clinic B Inventory
1. Switch to **Clinic B** using the clinic switcher
2. Navigate to **Inventory** page
3. **Expected Result:** You should see all units that belong to Clinic B (different from Clinic A)
4. Click on a unit to view details
5. **Expected Result:** Transaction history should show transactions for Clinic B

### Test Scenario 3: View Clinic A Reports
1. Switch to **Clinic A**
2. Navigate to **Reports** page
3. **Expected Result:** You should see all transactions for Clinic A

### Test Scenario 4: View Clinic B Reports
1. Switch to **Clinic B**
2. Navigate to **Reports** page
3. **Expected Result:** You should see all transactions for Clinic B (different from Clinic A)

### Test Scenario 5: Unauthorized Access Protection
1. As a user with access to only Clinic A
2. Try to directly query Clinic B's data (would require GraphQL Playground)
3. **Expected Result:** Should receive `FORBIDDEN` error

## 📊 Database Verification

You can verify the data is correctly scoped using these SQL queries:

```sql
-- Check clinics and their data
SELECT 
  c.clinic_id,
  c.name,
  COUNT(DISTINCT u.unit_id) as unit_count,
  COUNT(DISTINCT t.transaction_id) as transaction_count
FROM clinics c
LEFT JOIN units u ON c.clinic_id = u.clinic_id
LEFT JOIN transactions t ON c.clinic_id = t.clinic_id
GROUP BY c.clinic_id, c.name
ORDER BY c.created_at DESC;
```

```sql
-- Verify RLS policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('units', 'transactions')
ORDER BY tablename, policyname;
```

## 🔒 Security Considerations

1. **RLS Policies**: Row-level security is enforced at the database level
2. **Access Validation**: GraphQL resolvers verify user has access to requested clinic
3. **Multi-Clinic Support**: Users can belong to multiple clinics via the `users.clinic_ids` array
4. **Fail-Safe**: If no clinic is selected or invalid clinic is requested, queries are skipped or rejected

## 📝 Files Modified

1. `server/graphql/schema.ts` - Added `clinicId` parameter to queries
2. `server/graphql/resolvers.ts` - Added clinic access validation logic
3. `src/app/inventory/page.tsx` - Extract and pass clinicId from localStorage
4. `src/app/reports/page.tsx` - Extract and pass clinicId from localStorage

## 🎯 Next Steps

To complete testing:
1. Create test data in multiple clinics
2. Test switching between clinics
3. Verify inventory and reports show correct clinic-specific data
4. Verify unauthorized access is blocked
5. Test with users who have access to multiple clinics

## 💡 Additional Notes

- The fix maintains backward compatibility (clinicId is optional)
- If no clinicId is provided, the resolver uses the authenticated user's primary clinic
- The solution properly handles multi-clinic access for users with roles in multiple clinics
- All changes are type-safe and have no linter errors

