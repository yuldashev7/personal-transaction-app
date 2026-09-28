import { AuthenticationType } from 'expo-local-authentication';

/** Returning within this window after leaving the app does not ask to unlock again. */
export const LOCK_GRACE_MS = 30_000;

export function shouldLockOnResume(backgroundAt: number | null, now: number): boolean {
  return backgroundAt !== null && now - backgroundAt >= LOCK_GRACE_MS;
}

export type BiometricMethod = 'faceId' | 'touchId' | 'fingerprint' | 'face' | 'biometric';

/** `null` when the phone has no enrolled biometrics — only the app PIN is offered then. */
export function resolveBiometricMethod(
  types: readonly AuthenticationType[],
  enrolled: boolean,
  os: string,
): BiometricMethod | null {
  if (!enrolled || types.length === 0) return null;

  const face = types.includes(AuthenticationType.FACIAL_RECOGNITION);
  const fingerprint = types.includes(AuthenticationType.FINGERPRINT);

  if (os === 'ios') return face ? 'faceId' : fingerprint ? 'touchId' : null;
  return fingerprint ? 'fingerprint' : face ? 'face' : 'biometric';
}

const BIOMETRIC_METHOD_NAMES: Readonly<Record<BiometricMethod, string>> = {
  faceId: 'Face ID',
  touchId: 'Touch ID',
  fingerprint: 'Barmoq izi',
  face: 'Yuz orqali tanish',
  biometric: 'Biometrika',
};

export function getBiometricMethodName(method: BiometricMethod): string {
  return BIOMETRIC_METHOD_NAMES[method];
}
