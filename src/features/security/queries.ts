import { eq } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { settings } from '@/database/schema';

import { parsePinAttempts, type PinAttempts } from './pin';

export const SECURITY_SETTINGS = {
  appLock: 'app_lock_enabled',
  biometricUnlock: 'biometric_unlock_enabled',
  pinAttempts: 'pin_attempts',
} as const;

export type SecuritySetting = (typeof SECURITY_SETTINGS)[keyof typeof SECURITY_SETTINGS];

function getSettingValue(db: Database, key: SecuritySetting): string | null {
  const row = db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .get();
  return row?.value ?? null;
}

export interface SecuritySettings {
  readonly appLock: boolean;
  readonly biometricUnlock: boolean;
}

/** Anything other than a stored JSON `true` (missing row, corrupt value) means "off". */
export function getSecuritySettings(db: Database): SecuritySettings {
  return {
    appLock: getSettingValue(db, SECURITY_SETTINGS.appLock) === 'true',
    biometricUnlock: getSettingValue(db, SECURITY_SETTINGS.biometricUnlock) === 'true',
  };
}

export function getPinAttempts(db: Database): PinAttempts {
  return parsePinAttempts(getSettingValue(db, SECURITY_SETTINGS.pinAttempts));
}
