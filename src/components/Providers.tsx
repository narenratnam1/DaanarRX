'use client';

import { ApolloProvider } from '@apollo/client';
import { Provider } from 'react-redux';
import { apolloClient } from '../lib/apollo';
import { store } from '../store';
import { FeedbackButton } from './FeedbackButton';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient!}>
        {children}
        <FeedbackButton />
        <Toaster />
      </ApolloProvider>
    </Provider>
  );
}
