export const PIN_LENGTH = 4;
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 30_000;

export function isValidPin(pin: string): boolean {
  return pin.length === PIN_LENGTH && /^\d+$/.test(pin);
}

export interface PinRecord {
  readonly salt: string;
  readonly hash: string;
}

export function parsePinRecord(raw: string | null): PinRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'salt' in value &&
      'hash' in value &&
      typeof value.salt === 'string' &&
      typeof value.hash === 'string'
    ) {
      return { salt: value.salt, hash: value.hash };
    }
  } catch {
    // Corrupt entries are treated as "no PIN".
  }
  return null;
}

export interface PinAttempts {
  readonly failures: number;
  readonly lockedUntil: number;
}

export const NO_PIN_ATTEMPTS: PinAttempts = { failures: 0, lockedUntil: 0 };

export function parsePinAttempts(raw: string | null): PinAttempts {
  if (!raw) return NO_PIN_ATTEMPTS;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'failures' in value &&
      'lockedUntil' in value &&
      typeof value.failures === 'number' &&
      typeof value.lockedUntil === 'number'
    ) {
      return { failures: value.failures, lockedUntil: value.lockedUntil };
    }
  } catch {
    // Corrupt entries reset the attempt counter.
  }
  return NO_PIN_ATTEMPTS;
}

/** Every `MAX_PIN_ATTEMPTS`-th wrong PIN starts a lockout and resets the counter. */
export function recordPinFailure(attempts: PinAttempts, now: number): PinAttempts {
  const failures = attempts.failures + 1;
  return failures >= MAX_PIN_ATTEMPTS
    ? { failures: 0, lockedUntil: now + PIN_LOCKOUT_MS }
    : { failures, lockedUntil: attempts.lockedUntil };
}

export function getLockoutRemainingMs(attempts: PinAttempts, now: number): number {
  return Math.max(0, attempts.lockedUntil - now);
}

export type PinCheck =
  | { readonly kind: 'ok' }
  | { readonly kind: 'wrong'; readonly attemptsLeft: number }
  | { readonly kind: 'locked_out'; readonly remainingMs: number }
  | { readonly kind: 'error' };

export function getPinCheckMessage(check: PinCheck): string | null {
  switch (check.kind) {
    case 'ok':
      return null;
    case 'wrong':
      return check.attemptsLeft <= 2
        ? `Notoʻgʻri PIN. Yana ${check.attemptsLeft} ta urinish qoldi.`
        : 'Notoʻgʻri PIN. Qaytadan kiriting.';
    case 'locked_out':
      return `Juda koʻp urinish. ${Math.ceil(check.remainingMs / 1000)} soniyadan keyin qayta urining.`;
    case 'error':
      return 'PINʼni tekshirib boʻlmadi. Qaytadan urinib koʻring.';
  }
}
