import { getAccountIcon } from '@/features/accounts/presentation';
import { formatMoney } from '@/shared/lib/money';
import { ListRow } from '@/shared/ui/ListRow';
import { Surface } from '@/shared/ui/Surface';

import type { AccountActivity } from '../types';

export interface AccountActivityListProps {
  readonly accounts: readonly AccountActivity[];
}

export function AccountActivityList({ accounts }: AccountActivityListProps) {
  return (
    <Surface>
      {accounts.map((account) => {
        const parts: string[] = [];
        if (account.incomeMinor > 0) {
          parts.push(
            `Daromad ${formatMoney(account.incomeMinor, undefined, { signDisplay: 'always' })}`,
          );
        }
        if (account.expenseMinor > 0) {
          parts.push(`Xarajat ${formatMoney(-account.expenseMinor)}`);
        }
        return (
          <ListRow
            key={account.id}
            icon={getAccountIcon(account)}
            title={account.name}
            subtitle={parts.join(' · ')}
          />
        );
      })}
    </Surface>
  );
}
