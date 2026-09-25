'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE_LOGOUT = 1 * 60 * 1000; // 1 minute warning
const WARNING_TIMEOUT = INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT;

export function AutoLogout() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const showWarningRef = useRef(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setShowWarning(false);
    showWarningRef.current = false;

    if (!isAuthenticated) return;

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      showWarningRef.current = true;
    }, WARNING_TIMEOUT);

    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      // Don't reset activity if the warning is showing, require them to click the button
      if (!showWarningRef.current) {
        resetTimers();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, handleActivity));

    resetTimers(); // Start initially

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [isAuthenticated, resetTimers, pathname]); // Removed showWarning from dependencies

  const handleContinueSession = () => {
    resetTimers();
  };

  const handleLogoutNow = () => {
    logout();
  };

  if (!isAuthenticated) return null;

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring</AlertDialogTitle>
          <AlertDialogDescription>
            You have been inactive for a while. You will be automatically logged out in 1 minute to protect your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogoutNow}>Log Out Now</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinueSession}>Continue Session</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
