import { AuthenticationType } from 'expo-local-authentication';

import type { Database } from '@/database/client';
import { settings } from '@/database/schema';
import { createTestDatabase } from '@/database/testing/createTestDatabase';
import { TEST_NOW as NOW, unwrap } from '@/database/testing/helpers';

import {
  getLockoutRemainingMs,
  getPinCheckMessage,
  isValidPin,
  MAX_PIN_ATTEMPTS,
  NO_PIN_ATTEMPTS,
  parsePinAttempts,
  parsePinRecord,
  PIN_LOCKOUT_MS,
  recordPinFailure,
  type PinAttempts,
} from './pin';
import { deleteStoredPin, hasStoredPin, saveStoredPin, verifyStoredPin } from './pin-store';
import {
  getBiometricMethodName,
  LOCK_GRACE_MS,
  resolveBiometricMethod,
  shouldLockOnResume,
} from './presentation';
import { getPinAttempts, getSecuritySettings, SECURITY_SETTINGS } from './queries';
import { setAppLockEnabled, setBiometricUnlockEnabled, setPinAttempts } from './repository';

const mockSecureStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 5,
  getItem: (key: string) => mockSecureStore.get(key) ?? null,
  getItemAsync: async (key: string) => mockSecureStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    mockSecureStore.delete(key);
  },
}));

describe('security settings', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDatabase();
  });

  it('is off by default', () => {
    expect(getSecuritySettings(db)).toEqual({ appLock: false, biometricUnlock: false });
    expect(getPinAttempts(db)).toEqual(NO_PIN_ATTEMPTS);
  });

  it('turning the lock off clears every security setting', () => {
    unwrap(setAppLockEnabled(db, true, NOW));
    unwrap(setBiometricUnlockEnabled(db, true, NOW));
    unwrap(setPinAttempts(db, { failures: 2, lockedUntil: 0 }, NOW));
    expect(getSecuritySettings(db)).toEqual({ appLock: true, biometricUnlock: true });
    expect(getPinAttempts(db).failures).toBe(2);

    unwrap(setAppLockEnabled(db, false, NOW));
    expect(getSecuritySettings(db)).toEqual({ appLock: false, biometricUnlock: false });
    expect(db.select().from(settings).all()).toEqual([]);
  });

  it('treats corrupt values as defaults', () => {
    db.insert(settings)
      .values([
        { key: SECURITY_SETTINGS.appLock, value: '{oops', updatedAt: NOW },
        { key: SECURITY_SETTINGS.pinAttempts, value: '"x"', updatedAt: NOW },
      ])
      .run();
    expect(getSecuritySettings(db).appLock).toBe(false);
    expect(getPinAttempts(db)).toEqual(NO_PIN_ATTEMPTS);
  });
});

describe('PIN rules', () => {
  it('accepts exactly four digits', () => {
    expect(isValidPin('0123')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('locks out after the fifth wrong PIN and resets the counter', () => {
    let attempts: PinAttempts = NO_PIN_ATTEMPTS;
    for (let i = 1; i < MAX_PIN_ATTEMPTS; i += 1) {
      attempts = recordPinFailure(attempts, NOW);
      expect(getLockoutRemainingMs(attempts, NOW)).toBe(0);
    }
    expect(attempts.failures).toBe(MAX_PIN_ATTEMPTS - 1);

    attempts = recordPinFailure(attempts, NOW);
    expect(attempts).toEqual({ failures: 0, lockedUntil: NOW + PIN_LOCKOUT_MS });
    expect(getLockoutRemainingMs(attempts, NOW + 10_000)).toBe(PIN_LOCKOUT_MS - 10_000);
    expect(getLockoutRemainingMs(attempts, NOW + PIN_LOCKOUT_MS)).toBe(0);
  });

  it('parses stored records defensively', () => {
    expect(parsePinRecord(null)).toBeNull();
    expect(parsePinRecord('nope')).toBeNull();
    expect(parsePinRecord('{"salt":1,"hash":"x"}')).toBeNull();
    expect(parsePinRecord('{"salt":"s","hash":"h"}')).toEqual({ salt: 's', hash: 'h' });
    expect(parsePinAttempts('{"failures":1,"lockedUntil":5}')).toEqual({
      failures: 1,
      lockedUntil: 5,
    });
  });

  it('builds user-facing messages', () => {
    expect(getPinCheckMessage({ kind: 'ok' })).toBeNull();
    expect(getPinCheckMessage({ kind: 'wrong', attemptsLeft: 4 })).toBe(
      'Notoʻgʻri PIN. Qaytadan kiriting.',
    );
    expect(getPinCheckMessage({ kind: 'wrong', attemptsLeft: 2 })).toBe(
      'Notoʻgʻri PIN. Yana 2 ta urinish qoldi.',
    );
    expect(getPinCheckMessage({ kind: 'locked_out', remainingMs: 29_100 })).toBe(
      'Juda koʻp urinish. 30 soniyadan keyin qayta urining.',
    );
  });
});

describe('PIN store', () => {
  beforeEach(() => mockSecureStore.clear());

  it('stores only a salted hash and verifies it', async () => {
    expect(hasStoredPin()).toBe(false);
    expect(await verifyStoredPin('1234')).toBeNull();

    expect(await saveStoredPin('1234')).toBe(true);
    expect(hasStoredPin()).toBe(true);
    expect([...mockSecureStore.values()].join()).not.toContain('1234');

    expect(await verifyStoredPin('1234')).toBe(true);
    expect(await verifyStoredPin('4321')).toBe(false);

    await deleteStoredPin();
    expect(hasStoredPin()).toBe(false);
  });

  it('uses a new salt every time', async () => {
    await saveStoredPin('1234');
    const first = [...mockSecureStore.values()][0];
    await saveStoredPin('1234');
    expect([...mockSecureStore.values()][0]).not.toBe(first);
  });
});

describe('shouldLockOnResume', () => {
  it('locks only after the grace period in the background', () => {
    expect(shouldLockOnResume(null, NOW)).toBe(false);
    expect(shouldLockOnResume(NOW, NOW + LOCK_GRACE_MS - 1)).toBe(false);
    expect(shouldLockOnResume(NOW, NOW + LOCK_GRACE_MS)).toBe(true);
  });
});

describe('resolveBiometricMethod', () => {
  const { FACIAL_RECOGNITION: FACE, FINGERPRINT, IRIS } = AuthenticationType;

  it('names iOS methods', () => {
    expect(resolveBiometricMethod([FACE], true, 'ios')).toBe('faceId');
    expect(resolveBiometricMethod([FINGERPRINT], true, 'ios')).toBe('touchId');
    expect(getBiometricMethodName('faceId')).toBe('Face ID');
  });

  it('prefers fingerprint on Android', () => {
    expect(resolveBiometricMethod([FACE, FINGERPRINT], true, 'android')).toBe('fingerprint');
    expect(resolveBiometricMethod([FACE], true, 'android')).toBe('face');
    expect(resolveBiometricMethod([IRIS], true, 'android')).toBe('biometric');
  });

  it('returns null without enrolled biometrics', () => {
    expect(resolveBiometricMethod([FACE], false, 'ios')).toBeNull();
    expect(resolveBiometricMethod([], true, 'android')).toBeNull();
  });
});
