import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { LockScreen } from './LockScreen';
import {
  isSessionAuthenticated,
  lockSession,
  getAutoLockMinutes
} from '../lib/security';

interface AuthContextType {
  isAuthenticated: boolean;
  lockCockpit: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  lockCockpit: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionAuthenticated());

  const handleLock = useCallback(() => {
    lockSession();
    setIsAuthenticated(false);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  // Inactivity Auto-Lock Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      const autoLockMins = getAutoLockMinutes();
      if (autoLockMins > 0) {
        timeoutId = setTimeout(() => {
          handleLock();
        }, autoLockMins * 60 * 1000);
      }
    };

    // User interaction events that reset the inactivity timer
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Throttle event listener slightly
    let lastCall = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastCall > 1000) {
        lastCall = now;
        resetTimer();
      }
    };

    activityEvents.forEach(evt => window.addEventListener(evt, throttledReset, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(evt => window.removeEventListener(evt, throttledReset));
    };
  }, [isAuthenticated, handleLock]);

  if (!isAuthenticated) {
    return <LockScreen onUnlockSuccess={handleUnlock} />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, lockCockpit: handleLock }}>
      {children}
    </AuthContext.Provider>
  );
};
