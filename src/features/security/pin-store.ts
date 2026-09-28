import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { logger } from '@/shared/lib/logger';

import { parsePinRecord, type PinRecord } from './pin';

const PIN_KEY = 'moneo.app_pin';

/** Not migrated to another device: a restored backup starts without an app PIN. */
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hashPin(pin: string, salt: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

/** Synchronous so the lock state is known on the first render. */
export function hasStoredPin(): boolean {
  try {
    return parsePinRecord(SecureStore.getItem(PIN_KEY, STORE_OPTIONS)) !== null;
  } catch (error) {
    logger.error('Failed to read the app PIN', error);
    return false;
  }
}

export async function saveStoredPin(pin: string): Promise<boolean> {
  try {
    const salt = toHex(getRandomBytes(16));
    const record: PinRecord = { salt, hash: await hashPin(pin, salt) };
    await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(record), STORE_OPTIONS);
    return true;
  } catch (error) {
    logger.error('Failed to save the app PIN', error);
    return false;
  }
}

/** `null` when the stored PIN cannot be read. */
export async function verifyStoredPin(pin: string): Promise<boolean | null> {
  try {
    const record = parsePinRecord(await SecureStore.getItemAsync(PIN_KEY, STORE_OPTIONS));
    if (!record) return null;
    return (await hashPin(pin, record.salt)) === record.hash;
  } catch (error) {
    logger.error('Failed to verify the app PIN', error);
    return null;
  }
}

export async function deleteStoredPin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY, STORE_OPTIONS);
  } catch (error) {
    logger.warn('Failed to delete the app PIN', error);
  }
}
