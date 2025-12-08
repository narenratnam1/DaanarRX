'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useMutation, useQuery, useLazyQuery, gql } from '@apollo/client';
import { setAuth } from '../../../store/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Info, Loader2, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const CHECK_EMAIL_EXISTS = gql`
  query CheckEmailExists($email: String!) {
    checkEmailExists(email: $email) {
      exists
      message
    }
  }
`;

const SIGN_UP_MUTATION = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
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

const ACCEPT_INVITATION_MUTATION = gql`
  mutation AcceptInvitation($input: AcceptInvitationInput!) {
    acceptInvitation(input: $input) {
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

const GET_INVITATION_BY_TOKEN = gql`
  query GetInvitationByToken($invitationToken: ID!) {
    getInvitationByToken(invitationToken: $invitationToken) {
      invitationId
      email
      userRole
      status
      expiresAt
      clinic {
        clinicId
        name
        primaryColor
        secondaryColor
        logoUrl
      }
      invitedByUser {
        username
      }
    }
  }
`;

function SignUpContent() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  
  return invitationToken ? (
    <AcceptInvitationForm invitationToken={invitationToken} />
  ) : (
    <RegularSignUpForm />
  );
}

function AcceptInvitationForm({ invitationToken }: { invitationToken: string }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [password, setPassword] = useState('');

  const { data: invitationData, loading: invitationLoading, error: invitationError } = useQuery(
    GET_INVITATION_BY_TOKEN,
    {
      variables: { invitationToken },
      fetchPolicy: 'network-only',
    }
  );

  const [acceptInvitation, { loading }] = useMutation(ACCEPT_INVITATION_MUTATION, {
    onCompleted: (data) => {
      dispatch(
        setAuth({
          user: data.acceptInvitation.user,
          clinic: data.acceptInvitation.clinic,
          token: data.acceptInvitation.token,
        })
      );

      toast({
        title: 'Success',
        description: 'Welcome to DaanaRX!',
      });

      router.push('/');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    acceptInvitation({
      variables: {
        input: {
          invitationToken,
          password,
        },
      },
    });
  };

  if (invitationLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (invitationError || !invitationData?.getInvitationByToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center space-y-2 text-center mb-8">
            <div className="rounded-full bg-primary p-3">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">DaanaRX</h1>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>We couldn&apos;t find your invitation</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invitation Error</AlertTitle>
                <AlertDescription>
                  This invitation link is invalid or has expired. Please contact your administrator for a
                  new invitation.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push('/auth/signin')}
              >
                Go to Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const invitation = invitationData.getInvitationByToken;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary p-3">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DaanaRX</h1>
          <p className="text-muted-foreground">Complete your account setup</p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">You&apos;ve been invited!</CardTitle>
            <CardDescription>Set up your account to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Invitation Details</AlertTitle>
              <AlertDescription className="mt-2 space-y-1">
                <p className="text-sm">
                  <strong>{invitation.invitedByUser.username}</strong> has invited you to join{' '}
                  <strong>{invitation.clinic?.name || 'the clinic'}</strong> as a{' '}
                  <strong className="capitalize">{invitation.userRole}</strong>.
                </p>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic">Clinic Name</Label>
                <Input
                  id="clinic"
                  value={invitation.clinic?.name || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">You&apos;re joining this clinic</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Your account email address</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Choose a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a strong password to secure your account
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Sign Up
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to join the clinic and follow their policies.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function RegularSignUpForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [emailExists, setEmailExists] = useState(false);

  const [checkEmail] = useLazyQuery(CHECK_EMAIL_EXISTS, {
    onCompleted: (data) => {
      const exists = data?.checkEmailExists?.exists;
      setEmailExists(exists);

      if (exists) {
        toast({
          title: 'Account exists',
          description: 'An account with this email already exists. Please sign in instead.',
        });
      }
    },
    onError: (error) => {
      console.error('Error checking email:', error);
    },
  });

  const [signUp, { loading }] = useMutation(SIGN_UP_MUTATION, {
    onCompleted: (data) => {
      dispatch(
        setAuth({
          user: data.signUp.user,
          clinic: data.signUp.clinic,
          token: data.signUp.token,
        })
      );

      toast({
        title: 'Success',
        description: 'Account created successfully',
      });

      router.push('/');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    },
  });

  const handleEmailBlur = () => {
    if (!email || !email.includes('@')) return;
    checkEmail({ variables: { email } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (emailExists) {
      router.push('/auth/signin');
      return;
    }

    signUp({ variables: { input: { email, password, clinicName } } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary p-3">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DaanaRX</h1>
          <p className="text-muted-foreground">Create your clinic account</p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Get started</CardTitle>
            <CardDescription>Create your account to start tracking medications</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  placeholder="Your Clinic Name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailExists(false);
                  }}
                  onBlur={handleEmailBlur}
                  required
                  className="h-11"
                />
                {emailExists && (
                  <p className="text-sm text-destructive">
                    This email is already registered. Please sign in instead.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          HIPAA-compliant medication tracking for non-profit clinics
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
