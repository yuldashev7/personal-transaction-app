import { TRANSACTION_TYPES } from '@/database/schema';
import { isValidTimestamp } from '@/shared/lib/date';
import type { FieldErrors } from '@/shared/lib/errors';
import { parseMoney } from '@/shared/lib/money';
import { err, ok, type Result } from '@/shared/lib/result';

import type {
  TransactionField,
  TransactionFieldError,
  TransactionInput,
  ValidTransactionInput,
} from './types';

export const NOTE_MAX_LENGTH = 200;

/** Allows small clock differences and "later today" entries, but not far-future dates. */
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

export type TransactionFieldErrors = FieldErrors<TransactionField, TransactionFieldError>;

/** Checks the shape of the input. Whether accounts/categories exist is checked by the repository. */
export function validateTransactionInput(
  input: TransactionInput,
  now: number = Date.now(),
): Result<ValidTransactionInput, TransactionFieldErrors> {
  const errors: { [K in TransactionField]?: TransactionFieldError } = {};

  if (!TRANSACTION_TYPES.includes(input.type)) errors.type = 'invalid_type';

  let amountMinor = 0;
  const amount = parseMoney(input.amount);
  if (!amount.ok) {
    errors.amount = amount.error === 'empty' ? 'required' : amount.error;
  } else if (amount.value <= 0) {
    errors.amount = 'not_positive';
  } else {
    amountMinor = amount.value;
  }

  const accountId = input.accountId;
  if (!accountId) errors.accountId = 'required';

  const toAccountId = input.toAccountId;
  const categoryIds = [...new Set(input.categoryIds)];
  if (input.type === 'transfer') {
    if (!toAccountId) errors.toAccountId = 'required';
    else if (toAccountId === accountId) errors.toAccountId = 'same_account';
  } else if (categoryIds.length === 0) {
    errors.categoryIds = 'required';
  }

  const trimmedNote = input.note.trim();
  if ([...trimmedNote].length > NOTE_MAX_LENGTH) errors.note = 'too_long';
  const note = trimmedNote === '' ? null : trimmedNote;

  if (!isValidTimestamp(input.occurredAt)) errors.occurredAt = 'invalid';
  else if (input.occurredAt > now + FUTURE_TOLERANCE_MS) errors.occurredAt = 'in_future';

  if (Object.keys(errors).length > 0 || !accountId) return err(errors);

  const base = { accountId, amountMinor, note, occurredAt: input.occurredAt };
  if (input.type === 'transfer') {
    return toAccountId ? ok({ ...base, type: 'transfer', toAccountId }) : err(errors);
  }
  return ok({ ...base, type: input.type, categoryIds });
}
