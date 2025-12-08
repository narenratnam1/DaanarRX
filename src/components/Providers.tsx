'use client';

import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { Provider, useDispatch } from 'react-redux';
import { apolloClient } from '../lib/apollo';
import { store } from '../store';
import { restoreAuth } from '../store/authSlice';
import { FeedbackButton } from './FeedbackButton';
import { Toaster } from '@/components/ui/toaster';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Immediately restore auth state on app load
    dispatch(restoreAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient!}>
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <FeedbackButton />
        <Toaster />
      </ApolloProvider>
    </Provider>
  );
}
