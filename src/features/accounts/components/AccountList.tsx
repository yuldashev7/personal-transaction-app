import { Surface } from '@/shared/ui/Surface';

import type { AccountWithBalance } from '../types';
import { AccountRow } from './AccountRow';

export interface AccountListProps {
  readonly accounts: readonly AccountWithBalance[];
  readonly onPressAccount: (account: AccountWithBalance) => void;
}

/** A handful of accounts at most, so a plain list (no virtualization) is enough. */
export function AccountList({ accounts, onPressAccount }: AccountListProps) {
  return (
    <Surface>
      {accounts.map((account) => (
        <AccountRow key={account.id} account={account} onPress={() => onPressAccount(account)} />
      ))}
    </Surface>
  );
}
