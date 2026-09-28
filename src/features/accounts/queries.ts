import { and, asc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { accounts, transactions } from '@/database/schema';
import { DEFAULT_CURRENCY } from '@/shared/lib/money';

import type { Account, AccountWithBalance } from './types';

/**
 * Drizzle renders columns unqualified in single-table selects (`"id"`), which inside the
 * correlated subqueries below would resolve to `transactions.id`. The outer reference must be explicit.
 */
const outerAccountId = sql`${accounts}.${sql.identifier(accounts.id.name)}`;

/**
 * Current balance = initial balance + income − expenses − outgoing transfers + incoming transfers.
 * Computed from transactions on every read (never stored), using the per-account indexes.
 */
const balanceMinor = sql<number>`${accounts.initialBalanceMinor}
  + COALESCE((
      SELECT SUM(CASE WHEN ${transactions.type} = 'income'
                      THEN ${transactions.amountMinor}
                      ELSE -${transactions.amountMinor} END)
      FROM ${transactions}
      WHERE ${transactions.accountId} = ${outerAccountId} AND ${transactions.deletedAt} IS NULL
    ), 0)
  + COALESCE((
      SELECT SUM(${transactions.amountMinor})
      FROM ${transactions}
      WHERE ${transactions.toAccountId} = ${outerAccountId} AND ${transactions.deletedAt} IS NULL
    ), 0)`.mapWith(Number);

export function getAccountsWithBalance(
  db: Database,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): AccountWithBalance[] {
  return db
    .select({ ...getTableColumns(accounts), balanceMinor })
    .from(accounts)
    .where(
      and(isNull(accounts.deletedAt), includeArchived ? undefined : isNull(accounts.archivedAt)),
    )
    .orderBy(asc(accounts.sortOrder), asc(accounts.createdAt))
    .all();
}

export function getAccountWithBalance(db: Database, id: string): AccountWithBalance | undefined {
  return db
    .select({ ...getTableColumns(accounts), balanceMinor })
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .get();
}

export function getAccountById(db: Database, id: string): Account | undefined {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
    .get();
}

/** Sum of active (non-archived) accounts. MVP is single-currency, so other currencies are skipped. */
export function getTotalBalance(accountList: readonly AccountWithBalance[]): number {
  return accountList.reduce(
    (total, account) =>
      account.archivedAt === null && account.currencyCode === DEFAULT_CURRENCY
        ? total + account.balanceMinor
        : total,
    0,
  );
}
