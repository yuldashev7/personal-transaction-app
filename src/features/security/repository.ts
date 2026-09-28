import { inArray } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { runInDatabase } from '@/database/errors';
import { settings } from '@/database/schema';
import type { AppError } from '@/shared/lib/errors';
import { ok, type Result } from '@/shared/lib/result';

import type { PinAttempts } from './pin';
import { SECURITY_SETTINGS, type SecuritySetting } from './queries';

function writeSetting(db: Database, key: SecuritySetting, value: string, now: number): void {
  db.insert(settings)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now } })
    .run();
}

export function setAppLockEnabled(
  db: Database,
  enabled: boolean,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() => {
    if (enabled) {
      writeSetting(db, SECURITY_SETTINGS.appLock, 'true', now);
    } else {
      db.delete(settings)
        .where(inArray(settings.key, Object.values(SECURITY_SETTINGS)))
        .run();
    }
    return ok(undefined);
  });
}

export function setBiometricUnlockEnabled(
  db: Database,
  enabled: boolean,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() => {
    writeSetting(db, SECURITY_SETTINGS.biometricUnlock, JSON.stringify(enabled), now);
    return ok(undefined);
  });
}

export function setPinAttempts(
  db: Database,
  attempts: PinAttempts,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() => {
    writeSetting(db, SECURITY_SETTINGS.pinAttempts, JSON.stringify(attempts), now);
    return ok(undefined);
  });
}
