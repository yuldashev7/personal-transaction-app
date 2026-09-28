import { Surface } from '@/shared/ui/Surface';

import type { TransactionListItem } from '../types';
import { TransactionRow } from './TransactionRow';

export interface TransactionListProps {
  readonly items: readonly TransactionListItem[];
  readonly now: number;
  readonly onPressItem: (item: TransactionListItem) => void;
  readonly onLongPressItem?: (item: TransactionListItem) => void;
}

export function TransactionList({
  items,
  now,
  onPressItem,
  onLongPressItem,
}: TransactionListProps) {
  return (
    <Surface>
      {items.map((item) => (
        <TransactionRow
          key={item.id}
          item={item}
          now={now}
          onPress={() => onPressItem(item)}
          onLongPress={onLongPressItem && (() => onLongPressItem(item))}
        />
      ))}
    </Surface>
  );
}
