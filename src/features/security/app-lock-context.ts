import { createContext, use } from 'react';

import { logger } from '@/shared/lib/logger';

import type { AuthOutcome } from './authentication';
import type { PinCheck } from './pin';
import type { BiometricMethod } from './presentation';

export interface AppLockContextValue {
  readonly enabled: boolean;
  readonly biometricMethod: BiometricMethod | null;
  /** The phone has the method, but this runtime cannot use it (Face ID in Expo Go). */
  readonly biometricBlocked: boolean;
  readonly biometricEnabled: boolean;
  readonly lockedUntil: number;
  readonly authenticate: (
    prompt: string,
    options: { biometricOnly: boolean },
  ) => Promise<AuthOutcome | null>;
  readonly checkPin: (pin: string) => Promise<PinCheck>;
  readonly savePin: (pin: string) => Promise<boolean>;
  readonly disableLock: () => Promise<boolean>;
  readonly setBiometricEnabled: (enabled: boolean) => Promise<AuthOutcome | 'error'>;
  readonly resetPinAttempts: () => void;
}

export const AppLockContext = createContext<AppLockContextValue | null>(null);

const FALLBACK_CONTEXT: AppLockContextValue = {
  enabled: false,
  biometricMethod: null,
  biometricBlocked: false,
  biometricEnabled: false,
  lockedUntil: 0,
  authenticate: async () => null,
  checkPin: async () => ({ kind: 'error' }),
  savePin: async () => false,
  disableLock: async () => false,
  setBiometricEnabled: async () => 'error',
  resetPinAttempts: () => logger.warn('useAppLock called outside AppLockProvider'),
};

export function useAppLock(): AppLockContextValue {
  return use(AppLockContext) ?? FALLBACK_CONTEXT;
}
