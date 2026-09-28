import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View, type AppStateStatus } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { getDatabase } from '@/database/client';
import { useLiveQuery } from '@/database/live-query';
import { settings } from '@/database/schema';
import { logger } from '@/shared/lib/logger';

import { AppLockContext, type AppLockContextValue } from './app-lock-context';
import {
  authenticate as authenticateWithSystem,
  FACE_ID_BLOCKED,
  getBiometricMethod,
  type AuthOutcome,
} from './authentication';
import { LockScreen } from './components/LockScreen';
import { getLockoutRemainingMs, NO_PIN_ATTEMPTS, recordPinFailure, type PinCheck } from './pin';
import { deleteStoredPin, hasStoredPin, saveStoredPin, verifyStoredPin } from './pin-store';
import { shouldLockOnResume, type BiometricMethod } from './presentation';
import { getPinAttempts, getSecuritySettings } from './queries';
import { setAppLockEnabled, setBiometricUnlockEnabled, setPinAttempts } from './repository';

const SETTINGS_TABLES = [settings];

export function AppLockProvider({ children }: PropsWithChildren) {
  const db = getDatabase();
  const settingsResult = useLiveQuery(
    () => ({ ...getSecuritySettings(db), attempts: getPinAttempts(db) }),
    SETTINGS_TABLES,
  );
  const current = settingsResult.ok
    ? settingsResult.value
    : { appLock: false, biometricUnlock: false, attempts: NO_PIN_ATTEMPTS };

  const [pinStored, setPinStored] = useState(hasStoredPin);
  const enabled = current.appLock && pinStored;

  const [locked, setLocked] = useState(enabled);
  const [contentMounted, setContentMounted] = useState(!enabled);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [biometricMethod, setBiometricMethod] = useState<BiometricMethod | null>(null);

  const backgroundAt = useRef<number | null>(null);
  const authenticating = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const refreshMethod = () => {
      getBiometricMethod().then((value) => {
        if (!cancelled) setBiometricMethod(value);
      });
    };
    refreshMethod();

    const subscription = AppState.addEventListener('change', (next) => {
      if (authenticating.current && next !== 'active') return;

      if (next === 'background') backgroundAt.current = Date.now();
      if (next === 'active') {
        if (enabled && shouldLockOnResume(backgroundAt.current, Date.now())) setLocked(true);
        backgroundAt.current = null;
        refreshMethod();
      }
      setAppState(next);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [enabled]);

  const authenticate: AppLockContextValue['authenticate'] = async (prompt, options) => {
    if (authenticating.current) return null;
    authenticating.current = true;
    try {
      return await authenticateWithSystem(prompt, options);
    } finally {
      authenticating.current = false;
    }
  };

  const saveAttempts = (attempts: typeof NO_PIN_ATTEMPTS) => {
    const saved = setPinAttempts(db, attempts);
    if (!saved.ok) logger.error('Failed to save PIN attempts', saved.error);
  };

  const checkPin = async (pin: string): Promise<PinCheck> => {
    const attempts = getPinAttempts(db);
    const remainingMs = getLockoutRemainingMs(attempts, Date.now());
    if (remainingMs > 0) return { kind: 'locked_out', remainingMs };

    const valid = await verifyStoredPin(pin);
    if (valid === null) return { kind: 'error' };
    if (valid) {
      saveAttempts(NO_PIN_ATTEMPTS);
      return { kind: 'ok' };
    }

    const now = Date.now();
    const next = recordPinFailure(attempts, now);
    saveAttempts(next);
    const lockout = getLockoutRemainingMs(next, now);
    return lockout > 0
      ? { kind: 'locked_out', remainingMs: lockout }
      : { kind: 'wrong', attemptsLeft: 5 - next.failures };
  };

  const savePin = async (pin: string): Promise<boolean> => {
    if (!(await saveStoredPin(pin))) return false;
    const saved = setAppLockEnabled(db, true);
    if (!saved.ok) {
      logger.error('Failed to enable app lock', saved.error);
      return false;
    }
    saveAttempts(NO_PIN_ATTEMPTS);
    setPinStored(true);
    return true;
  };

  const disableLock = async (): Promise<boolean> => {
    const saved = setAppLockEnabled(db, false);
    if (!saved.ok) {
      logger.error('Failed to disable app lock', saved.error);
      return false;
    }
    await deleteStoredPin();
    setPinStored(false);
    setLocked(false);
    return true;
  };

  const setBiometricEnabled = async (next: boolean): Promise<AuthOutcome | 'error'> => {
    if (next) {
      const outcome = await authenticate('Biometrik ochishni yoqish', { biometricOnly: true });
      if (outcome === null) return 'cancelled';
      if (outcome !== 'success') return outcome;
    }
    const saved = setBiometricUnlockEnabled(db, next);
    if (!saved.ok) {
      logger.error('Failed to save biometric unlock setting', saved.error);
      return 'error';
    }
    return 'success';
  };

  const unlock = () => {
    setLocked(false);
    setContentMounted(true);
  };

  const showLock = enabled && locked;
  const showCover = enabled && !locked && appState !== 'active';

  const biometricBlocked = biometricMethod === 'faceId' && FACE_ID_BLOCKED;

  const value: AppLockContextValue = {
    enabled,
    biometricMethod,
    biometricBlocked,
    biometricEnabled: current.biometricUnlock && !biometricBlocked,
    lockedUntil: current.attempts.lockedUntil,
    authenticate,
    checkPin,
    savePin,
    disableLock,
    setBiometricEnabled,
    resetPinAttempts: () => saveAttempts(NO_PIN_ATTEMPTS),
  };

  return (
    <AppLockContext value={value}>
      {contentMounted && (
        <View
          style={styles.content}
          accessibilityElementsHidden={showLock}
          importantForAccessibility={showLock ? 'no-hide-descendants' : 'auto'}>
          {children}
        </View>
      )}
      {(showLock || showCover) && (
        <TopOverlay>
          <LockScreen key={showLock ? 'lock' : 'cover'} interactive={showLock} onUnlock={unlock} />
        </TopOverlay>
      )}
    </AppLockContext>
  );
}

function TopOverlay({ children }: { children: ReactNode }) {
  return Platform.OS === 'ios' ? <FullWindowOverlay>{children}</FullWindowOverlay> : children;
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
