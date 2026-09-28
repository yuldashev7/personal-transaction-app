import { formatMoney } from '@/shared/lib/money';
import { AmountText } from '@/shared/ui/AmountText';
import { ListRow } from '@/shared/ui/ListRow';

import {
  getTransactionIcon,
  getTransactionSubtitle,
  getTransactionTitle,
  getTransactionTone,
  TRANSACTION_TYPE_OPTIONS,
} from '../presentation';
import type { TransactionListItem } from '../types';

export interface TransactionRowProps {
  readonly item: TransactionListItem;
  /** Reference time for "Bugun" / "Kecha" labels. */
  readonly now: number;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
}

export function TransactionRow({ item, now, onPress, onLongPress }: TransactionRowProps) {
  const title = getTransactionTitle(item);
  const subtitle = getTransactionSubtitle(item, now);
  const tone = getTransactionTone(item.type);
  const typeLabel = TRANSACTION_TYPE_OPTIONS.find((option) => option.type === item.type)?.label;

  return (
    <ListRow
      icon={getTransactionIcon(item)}
      iconColor={tone === 'neutral' ? 'primary' : tone}
      title={title}
      subtitle={subtitle}
      trailing={<AmountText amountMinor={item.amountMinor} tone={tone} variant="bodyStrong" />}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityHint={onLongPress ? 'Oʻchirish uchun bosib turing' : undefined}
      accessibilityLabel={`${typeLabel ?? ''} ${formatMoney(item.amountMinor)}, ${title}, ${subtitle}`}
    />
  );
}
