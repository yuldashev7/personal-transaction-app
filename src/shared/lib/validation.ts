import { err, ok, type Result } from './result';

export const NAME_MAX_LENGTH = 40;

export type NameError = 'required' | 'too_long';

/** Trims and collapses inner whitespace so "  TBC   card " and "TBC card" are the same name. */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateName(value: string): Result<string, NameError> {
  const name = normalizeName(value);
  if (name === '') return err('required');
  if ([...name].length > NAME_MAX_LENGTH) return err('too_long');
  return ok(name);
}
