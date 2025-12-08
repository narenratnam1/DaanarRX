# Build Fixes Applied

## Issues Fixed

### 1. Apollo Server Bundling Error

**Error:**
```
Module not found: Can't resolve '@yaacovcr/transform'
```

**Cause:**
Apollo Server v5 has optional dependencies that Next.js webpack tries to bundle but are not installed. This is a known issue with Apollo Server and Next.js.

**Solution:**
Updated `next.config.js` to externalize the problematic packages in the webpack configuration:

```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = config.externals || [];
    config.externals.push({
      '@yaacovcr/transform': '@yaacovcr/transform',
      'utf-8-validate': 'utf-8-validate',
      'bufferutil': 'bufferutil',
    });
  }
  return config;
}
```

### 2. GraphQL Route JSON Parsing Error

**Error:**
```
SyntaxError: Unexpected end of JSON input at req.json()
```

**Cause:**
The route handler was trying to parse JSON from an empty request body. This occurs when:
- Browser makes a GET request to the GraphQL endpoint
- Apollo Client DevTools tries to introspect the schema
- Preflight requests with empty bodies

**Solution:**
Updated `src/app/api/graphql/route.ts` to handle empty request bodies:

```typescript
// Read text first, check if empty
const text = await req.text();
if (!text || text.trim().length === 0) {
  // Handle as query parameters for GET requests
  body = {
    query: req.nextUrl.searchParams.get('query') || '',
    variables: req.nextUrl.searchParams.get('variables') 
      ? JSON.parse(req.nextUrl.searchParams.get('variables')!) 
      : undefined,
    operationName: req.nextUrl.searchParams.get('operationName') || undefined,
  };
} else {
  body = JSON.parse(text);
}
```

## Files Modified

1. `next.config.js` - Added webpack externals configuration
2. `src/app/api/graphql/route.ts` - Improved request body handling

## Testing

Both TypeScript compilation and build should now succeed without errors.

To verify:
```bash
npm run build
```

## References

- [Apollo Server Next.js integration](https://www.apollographql.com/docs/apollo-server/integrations/next-js)
- [Next.js webpack configuration](https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config)
