import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { logout, refreshActivity, restoreAuth, RootState } from '../store/authSlice';

const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const TOKEN_EXPIRY_CHECK_INTERVAL = 30 * 1000; // Check token expiry every 30 seconds

export function useAuth() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, lastActivity, expiresAt, hasHydrated } = useSelector(
    (state: RootState) => state.auth
  );

  // Safety timeout to ensure hydration completes
  useEffect(() => {
    if (!hasHydrated) {
      // If hydration hasn't happened within 2 seconds, something is wrong
      // Force hydration to prevent stuck loading screen
      const timeoutId = setTimeout(() => {
        console.warn('Hydration timeout - forcing completion');
        dispatch(restoreAuth());
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [hasHydrated, dispatch]);

  // Track user activity
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      dispatch(refreshActivity());
    }
  }, [dispatch, isAuthenticated]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated || !hasHydrated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, hasHydrated, handleActivity]);

  // Check for token expiration
  useEffect(() => {
    if (!isAuthenticated || !hasHydrated || !expiresAt) return;

    const checkTokenExpiry = () => {
      const now = Date.now();
      
      if (now >= expiresAt) {
        dispatch(logout('token_expired'));
        router.push('/auth/signin?reason=token_expired');
      }
    };

    const intervalId = setInterval(checkTokenExpiry, TOKEN_EXPIRY_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, hasHydrated, expiresAt, dispatch, router]);

  // Check for inactivity timeout
  useEffect(() => {
    if (!isAuthenticated || !hasHydrated || !lastActivity) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        dispatch(logout('inactivity'));
        router.push('/auth/signin?reason=inactivity');
      }
    };

    const intervalId = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, hasHydrated, lastActivity, dispatch, router]);

  // Redirect to login if not authenticated (except on auth pages)
  useEffect(() => {
    if (!hasHydrated) return;

    const isAuthPage = pathname?.startsWith('/auth/');
    
    if (!isAuthenticated && !isAuthPage) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, hasHydrated, pathname, router]);

  return {
    isAuthenticated,
    hasHydrated,
  };
}

