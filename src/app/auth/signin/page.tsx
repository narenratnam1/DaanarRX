'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, gql } from '@apollo/client';
import { setAuth } from '../../../store/authSlice';

const SIGN_IN_MUTATION = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      token
      user {
        userId
        username
        email
        clinicId
        userRole
      }
      clinic {
        clinicId
        name
        primaryColor
        secondaryColor
        logoUrl
      }
    }
  }
`;

interface ExpirationInfo {
  title: string;
  message: string;
  color: string;
}

function getExpirationInfo(reason: string | null): ExpirationInfo | null {
  if (!reason) return null;

  const expirationReasons: Record<string, ExpirationInfo> = {
    inactivity: {
      title: 'Session Expired Due to Inactivity',
      message: 'You were automatically logged out after 2 hours of inactivity for security reasons. Please sign in again to continue.',
      color: 'orange',
    },
    token_expired: {
      title: 'Session Expired',
      message: 'Your session has expired after 2 hours for security reasons. Please sign in again to continue.',
      color: 'orange',
    },
    invalid_token: {
      title: 'Invalid Session',
      message: 'Your session is no longer valid. This may have occurred due to signing in on another device. Please sign in again.',
      color: 'red',
    },
    session_expired: {
      title: 'Session Expired',
      message: 'Your session has ended for security reasons. Please sign in again to continue.',
      color: 'orange',
    },
    logged_out: {
      title: 'Logged Out',
      message: 'You have been successfully logged out.',
      color: 'blue',
    },
  };

  return expirationReasons[reason] || {
    title: 'Session Ended',
    message: 'Your session has ended. Please sign in again to continue.',
    color: 'orange',
  };
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expirationAlert, setExpirationAlert] = useState<ExpirationInfo | null>(null);

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check URL params for reason
    const reason = searchParams?.get('reason');
    const timeout = searchParams?.get('timeout'); // Legacy support
    
    if (reason) {
      const info = getExpirationInfo(reason);
      setExpirationAlert(info);
    } else if (timeout === 'true') {
      // Legacy support for old timeout parameter
      setExpirationAlert(getExpirationInfo('inactivity'));
    }
    
    // Also check localStorage for logout reason
    if (typeof window !== 'undefined') {
      const storedReason = localStorage.getItem('logoutReason');
      if (storedReason && !reason && timeout !== 'true') {
        const info = getExpirationInfo(storedReason);
        setExpirationAlert(info);
        localStorage.removeItem('logoutReason');
      }
    }
  }, [searchParams]);

  const [signIn, { loading }] = useMutation(SIGN_IN_MUTATION, {
    onCompleted: (data) => {
      if (!data?.signIn) {
        notifications.show({
          title: 'Error',
          message: 'Invalid response from server',
          color: 'red',
        });
        return;
      }

      setIsRedirecting(true);
      dispatch(setAuth({
        user: data.signIn.user,
        clinic: data.signIn.clinic,
        token: data.signIn.token,
      }));

      notifications.show({
        title: 'Success',
        message: 'Signed in successfully',
        color: 'green',
      });

      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push('/');
      }, 100);
    },
    onError: (error) => {
      console.error('Sign in mutation error:', error);
      // Extract error message from GraphQL error
      const errorMessage = 
        error.graphQLErrors?.[0]?.message || 
        error.networkError?.message || 
        error.message || 
        'Incorrect email or password';
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ variables: { input: { email, password } } });
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        DaanaRX
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Medication Tracking System
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        {expirationAlert && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title={expirationAlert.title}
            color={expirationAlert.color}
            mb="md"
            onClose={() => setExpirationAlert(null)}
            withCloseButton
          >
            {expirationAlert.message}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || isRedirecting}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || isRedirecting}
            />

            <Button type="submit" fullWidth loading={loading || isRedirecting}>
              {isRedirecting ? 'Redirecting...' : 'Sign In'}
            </Button>

            <Text size="sm" ta="center">
              Don&apos;t have an account?{' '}
              <Anchor href="/auth/signup" size="sm">
                Sign up
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
