import { err, ok, type Result } from './result';

export type CurrencyCode = 'UZS';

export interface CurrencyConfig {
  readonly code: CurrencyCode;
  /** Number of minor units digits (ISO 4217). Amounts are stored as `major * 10^scale`. */
  readonly scale: number;
}

export const CURRENCIES: Readonly<Record<CurrencyCode, CurrencyConfig>> = {
  UZS: { code: 'UZS', scale: 2 },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'UZS';

/** Keeps every stored amount and their sums far below Number.MAX_SAFE_INTEGER. */
export const MAX_AMOUNT_MINOR = 1_000_000_000_000_000;

export type MoneyParseError = 'empty' | 'invalid' | 'too_many_decimals' | 'too_large';

const WHITESPACE = /[\s\u00A0\u202F]/g;
const AMOUNT_PATTERN = /^(-)?(\d+)(?:[.,](\d*))?$/;
const GROUP_SEPARATOR = '\u00A0';
const DECIMAL_SEPARATOR = ',';

/**
 * Parses user input like "50 000", "50000", "1 250,5" or "-300" into integer minor units.
 * Only one decimal separator ("." or ",") is accepted, so "1,000,000" is rejected instead of guessed.
 */
export function parseMoney(
  input: string,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): Result<number, MoneyParseError> {
  const normalized = input.replace(WHITESPACE, '');
  if (normalized === '') return err('empty');

  const match = AMOUNT_PATTERN.exec(normalized);
  if (!match) return err('invalid');

  const [, sign, integerPart = '', fractionPart = ''] = match;
  const { scale } = CURRENCIES[currency];
  if (fractionPart.length > scale) return err('too_many_decimals');

  const factor = 10 ** scale;
  const major = Number(integerPart);
  if (major > MAX_AMOUNT_MINOR / factor) return err('too_large');

  const minor = major * factor + Number(fractionPart.padEnd(scale, '0') || '0');
  if (minor > MAX_AMOUNT_MINOR) return err('too_large');

  return ok(sign && minor !== 0 ? -minor : minor);
}

export interface FormatMoneyOptions {
  /** `always` prefixes positive amounts with "+" (income); `never` drops the minus sign. */
  readonly signDisplay?: 'auto' | 'always' | 'never';
  readonly showCurrency?: boolean;
}

/** Formats integer minor units as "50 000 UZS". Fraction digits are shown only when non-zero. */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  { signDisplay = 'auto', showCurrency = true }: FormatMoneyOptions = {},
): string {
  const { scale } = CURRENCIES[currency];
  const factor = 10 ** scale;
  const value = Math.trunc(amountMinor);
  const abs = Math.abs(value);
  const fraction = abs % factor;
  const major = (abs - fraction) / factor;

  let text = groupDigits(String(major));
  if (fraction !== 0) {
    text += DECIMAL_SEPARATOR + String(fraction).padStart(scale, '0');
  }

  const sign = getSign(value, signDisplay);
  const currencySuffix = showCurrency ? `${GROUP_SEPARATOR}${currency}` : '';
  return `${sign}${text}${currencySuffix}`;
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}

function getSign(value: number, signDisplay: FormatMoneyOptions['signDisplay']): string {
  if (value < 0) return signDisplay === 'never' ? '' : '-';
  if (value > 0 && signDisplay === 'always') return '+';
  return '';
}
