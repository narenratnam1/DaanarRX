'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useMutation, gql } from '@apollo/client';
import { setAuth } from '../../../store/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

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
  variant: 'default' | 'destructive';
}

function getExpirationInfo(reason: string | null): ExpirationInfo | null {
  if (!reason) return null;

  const expirationReasons: Record<string, ExpirationInfo> = {
    inactivity: {
      title: 'Session Expired Due to Inactivity',
      message: 'You were automatically logged out after 2 hours of inactivity for security reasons. Please sign in again to continue.',
      variant: 'default',
    },
    token_expired: {
      title: 'Session Expired',
      message: 'Your session has expired after 2 hours for security reasons. Please sign in again to continue.',
      variant: 'default',
    },
    invalid_token: {
      title: 'Invalid Session',
      message: 'Your session is no longer valid. This may have occurred due to signing in on another device. Please sign in again.',
      variant: 'destructive',
    },
    session_expired: {
      title: 'Session Expired',
      message: 'Your session has ended for security reasons. Please sign in again to continue.',
      variant: 'default',
    },
    logged_out: {
      title: 'Logged Out',
      message: 'You have been successfully logged out.',
      variant: 'default',
    },
  };

  return expirationReasons[reason] || {
    title: 'Session Ended',
    message: 'Your session has ended. Please sign in again to continue.',
    variant: 'default',
  };
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { toast } = useToast();
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
      // Clear any stale logout reason from localStorage since we have a URL param
      if (typeof window !== 'undefined') {
        localStorage.removeItem('logoutReason');
      }
    } else if (timeout === 'true') {
      // Legacy support for old timeout parameter
      setExpirationAlert(getExpirationInfo('inactivity'));
      if (typeof window !== 'undefined') {
        localStorage.removeItem('logoutReason');
      }
    } else {
      // Only check localStorage if there's no URL param
      if (typeof window !== 'undefined') {
        const storedReason = localStorage.getItem('logoutReason');
        if (storedReason) {
          const info = getExpirationInfo(storedReason);
          setExpirationAlert(info);
          // Immediately clear it so it doesn't persist
          localStorage.removeItem('logoutReason');
        }
      }
    }
  }, [searchParams]);

  const [signIn, { loading }] = useMutation(SIGN_IN_MUTATION, {
    onCompleted: (data) => {
      if (!data?.signIn) {
        toast({
          title: 'Error',
          description: 'Invalid response from server',
          variant: 'destructive',
        });
        return;
      }

      setIsRedirecting(true);
      dispatch(setAuth({
        user: data.signIn.user,
        clinic: data.signIn.clinic,
        token: data.signIn.token,
      }));

      toast({
        title: 'Success',
        description: 'Signed in successfully',
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
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ variables: { input: { email, password } } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary p-3">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DaanaRX</h1>
          <p className="text-muted-foreground">Medication Tracking System</p>
        </div>

        {/* Sign In Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {expirationAlert && (
              <Alert variant={expirationAlert.variant} className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{expirationAlert.title}</AlertTitle>
                <AlertDescription>{expirationAlert.message}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isRedirecting}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || isRedirecting}
                  required
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={loading || isRedirecting}
              >
                {loading || isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRedirecting ? 'Redirecting...' : 'Signing in...'}
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          HIPAA-compliant medication tracking for non-profit clinics
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
