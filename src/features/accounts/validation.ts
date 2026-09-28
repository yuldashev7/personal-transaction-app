import { ACCOUNT_KINDS } from '@/database/schema';
import type { FieldErrors } from '@/shared/lib/errors';
import { parseMoney } from '@/shared/lib/money';
import { err, ok, type Result } from '@/shared/lib/result';
import { validateName } from '@/shared/lib/validation';

import type { AccountField, AccountFieldError, AccountInput, ValidAccountInput } from './types';

/** Longest card numbers (PAN) have 19 digits. */
export const CARD_NUMBER_MAX_DIGITS = 19;

/** Keeps digits only, capped at 19. Not validated otherwise — it is only a display label. */
export function normalizeCardNumber(input: string): string {
  return input.replace(/\D/g, '').slice(0, CARD_NUMBER_MAX_DIGITS);
}

export function validateAccountInput(
  input: AccountInput,
): Result<ValidAccountInput, FieldErrors<AccountField, AccountFieldError>> {
  const errors: { [K in AccountField]?: AccountFieldError } = {};

  const name = validateName(input.name);
  if (!name.ok) errors.name = name.error;

  if (!ACCOUNT_KINDS.includes(input.kind)) errors.kind = 'invalid_kind';

  let initialBalanceMinor = 0;
  if (input.initialBalance.trim() !== '') {
    const parsed = parseMoney(input.initialBalance);
    if (parsed.ok) {
      initialBalanceMinor = parsed.value;
    } else if (parsed.error !== 'empty') {
      errors.initialBalance = parsed.error;
    }
  }

  const cardDigits = input.kind === 'card' ? normalizeCardNumber(input.cardNumber ?? '') : '';

  if (!name.ok || Object.keys(errors).length > 0) return err(errors);
  return ok({
    name: name.value,
    kind: input.kind,
    initialBalanceMinor,
    cardNumber: cardDigits === '' ? null : cardDigits,
  });
}
