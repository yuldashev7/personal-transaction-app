import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { logger } from '@/shared/lib/logger';

import { resolveBiometricMethod, type BiometricMethod } from './presentation';

export type AuthOutcome = 'success' | 'cancelled' | 'unavailable' | 'failed';

const UNAVAILABLE: ReadonlySet<LocalAuthentication.LocalAuthenticationError> = new Set([
  'not_enrolled',
  'not_available',
  'passcode_not_set',
]);

const CANCELLED: ReadonlySet<LocalAuthentication.LocalAuthenticationError> = new Set([
  'user_cancel',
  'app_cancel',
  'system_cancel',
  'user_fallback',
]);

interface AuthenticateOptions {
  /**
   * Unlocking with the app PIN's biometric shortcut must not fall back to the phone passcode —
   * that would bypass the app PIN. Only "Forgot PIN" allows the passcode.
   */
  readonly biometricOnly: boolean;
}

/** `unavailable`: no biometrics enrolled (biometric-only) or no screen lock at all. */
export async function authenticate(
  promptMessage: string,
  { biometricOnly }: AuthenticateOptions,
): Promise<AuthOutcome> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    const minimum = biometricOnly
      ? LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
      : LocalAuthentication.SecurityLevel.SECRET;
    if (level < minimum) return 'unavailable';

    const result = await LocalAuthentication.authenticateAsync(
      biometricOnly
        ? {
            promptMessage,
            cancelLabel: 'PIN kiritish',
            fallbackLabel: '',
            disableDeviceFallback: true,
          }
        : { promptMessage, cancelLabel: 'Bekor qilish', fallbackLabel: 'Parolni kiritish' },
    );
    if (result.success) return 'success';
    if (UNAVAILABLE.has(result.error)) return 'unavailable';
    if (CANCELLED.has(result.error)) return 'cancelled';

    logger.warn('Authentication failed', result.error);
    return 'failed';
  } catch (error) {
    logger.error('Authentication threw', error);
    return 'failed';
  }
}

/**
 * Expo Go's Info.plist has no `NSFaceIDUsageDescription`, so iOS rejects Face ID there with
 * `missing_usage_description`. Face ID works only in a native build of this app.
 */
export const FACE_ID_BLOCKED =
  Platform.OS === 'ios' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function getBiometricMethod(): Promise<BiometricMethod | null> {
  try {
    const [types, enrolled] = await Promise.all([
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return resolveBiometricMethod(types, enrolled, Platform.OS);
  } catch (error) {
    logger.warn('Could not read biometric capabilities', error);
    return null;
  }
}
