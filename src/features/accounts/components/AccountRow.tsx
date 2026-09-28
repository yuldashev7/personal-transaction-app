import { formatMoney } from '@/shared/lib/money';
import { AmountText } from '@/shared/ui/AmountText';
import { ListRow } from '@/shared/ui/ListRow';

import { formatCardNumber, getAccountIcon, getAccountKindLabel } from '../presentation';
import type { AccountWithBalance } from '../types';

export interface AccountRowProps {
  readonly account: AccountWithBalance;
  readonly onPress: () => void;
}

export function AccountRow({ account, onPress }: AccountRowProps) {
  const archived = account.archivedAt !== null;
  const subtitle = [
    getAccountKindLabel(account.kind),
    account.cardNumber !== null ? formatCardNumber(account.cardNumber) : null,
    archived ? 'arxivlangan' : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <ListRow
      icon={getAccountIcon(account)}
      iconColor={archived ? 'textTertiary' : 'primary'}
      title={account.name}
      subtitle={subtitle}
      trailing={
        <AmountText
          amountMinor={account.balanceMinor}
          currency={account.currencyCode}
          variant="bodyStrong"
          color={archived ? 'textSecondary' : undefined}
        />
      }
      showChevron
      onPress={onPress}
      accessibilityLabel={`${account.name}, ${subtitle}, balans ${formatMoney(account.balanceMinor, account.currencyCode)}`}
    />
  );
}
