import { getDatabase } from '@/database/client';
import { useLiveQuery } from '@/database/live-query';
import { accounts, transactions } from '@/database/schema';

import { getAccountsWithBalance, getAccountWithBalance } from './queries';

/** Balances depend on transactions, so both tables are watched. */
const BALANCE_TABLES = [accounts, transactions];

export function useAccounts({ includeArchived = false }: { includeArchived?: boolean } = {}) {
  const db = getDatabase();
  return useLiveQuery(() => getAccountsWithBalance(db, { includeArchived }), BALANCE_TABLES);
}

export function useAccount(id: string) {
  const db = getDatabase();
  return useLiveQuery(() => getAccountWithBalance(db, id) ?? null, BALANCE_TABLES);
}
