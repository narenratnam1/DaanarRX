import { ApolloServer } from '@apollo/server';
import { NextRequest, NextResponse } from 'next/server';
import { typeDefs, resolvers } from '@server/graphql';
import { createGraphQLContextFromNextRequest } from '@server/middleware';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  formatError: (error) => {
    const originalError = (error as any).originalError;
    console.error('GraphQL Error:', {
      message: error.message,
      code: error.extensions?.code,
      path: error.path,
      originalError: originalError?.message,
    });
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      extensions: error.extensions,
    };
  },
});

const serverStartPromise = server.start();

async function handler(req: NextRequest) {
  await serverStartPromise;

  try {
    // Handle empty body for GET requests
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim().length === 0) {
        // Empty body, likely a GET request for introspection
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
    } catch (parseError) {
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Invalid JSON in request body',
              extensions: { code: 'BAD_REQUEST' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const result = await server.executeOperation(
      {
        query: body.query,
        variables: body.variables,
        operationName: body.operationName,
      },
      {
        contextValue: await createGraphQLContextFromNextRequest(req),
      }
    );

    // Handle the response based on kind
    if (result.body.kind === 'single') {
      const singleResult = result.body.singleResult;
      
      // If there are errors, log them but still return 200 (GraphQL standard)
      if (singleResult.errors && singleResult.errors.length > 0) {
        console.error('GraphQL operation errors:', singleResult.errors);
      }
      
      return NextResponse.json(singleResult, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // For incremental responses, return the initial result
    return NextResponse.json(
      { errors: [{ message: 'Incremental responses not supported' }] },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('GraphQL request error:', error);
    return NextResponse.json(
      {
        errors: [
          {
            message: error?.message || 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          },
        ],
      },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST };

