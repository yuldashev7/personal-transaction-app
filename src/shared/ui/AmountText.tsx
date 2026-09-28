import type { ColorToken } from '@/shared/theme/colors';
import { DEFAULT_CURRENCY, formatMoney, type CurrencyCode } from '@/shared/lib/money';

import { Text, type TextProps } from './Text';

type AmountTone = 'income' | 'expense' | 'neutral';

const TONE_COLORS: Readonly<Record<AmountTone, ColorToken>> = {
  income: 'income',
  expense: 'expense',
  neutral: 'text',
};

export interface AmountTextProps extends Omit<TextProps, 'children' | 'tabularNumbers'> {
  readonly amountMinor: number;
  readonly currency?: CurrencyCode;
  /**
   * `income` → "+50 000 UZS" green, `expense` → "-50 000 UZS" red (sign from tone, not from value),
   * `neutral` → balance as-is.
   */
  readonly tone?: AmountTone;
  readonly showCurrency?: boolean;
}

export function AmountText({
  amountMinor,
  currency = DEFAULT_CURRENCY,
  tone = 'neutral',
  showCurrency = true,
  color,
  ...rest
}: AmountTextProps) {
  const value = tone === 'neutral' ? amountMinor : Math.abs(amountMinor);
  const text = formatMoney(tone === 'expense' ? -value : value, currency, {
    signDisplay: tone === 'income' ? 'always' : 'auto',
    showCurrency,
  });

  return (
    <Text color={color ?? TONE_COLORS[tone]} tabularNumbers numberOfLines={1} {...rest}>
      {text}
    </Text>
  );
}
