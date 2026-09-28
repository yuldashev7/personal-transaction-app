import { and, desc, eq, ne, sql } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { accounts, categories, transactionCategories, transactions } from '@/database/schema';
import {
  filterConditions,
  getTransactionTotals,
  outerTransactionColumn,
} from '@/features/transactions/queries';
import { getPeriodRange, type DateRange } from '@/shared/lib/date';

import type { AccountActivity, BreakdownKind, CategoryShare, MonthTotals } from './types';

const linkCount = sql`(SELECT COUNT(*) FROM ${transactionCategories} AS lc
  WHERE lc.transaction_id = ${outerTransactionColumn(transactions.id)})`;

/**
 * An entry with N categories gives each amount / N; the first category (position 0) also gets the
 * remainder, so no minor unit is lost and the shares sum to the period total.
 */
const shareMinor = sql<number>`SUM(${transactions.amountMinor} / ${linkCount}
  + CASE WHEN ${transactionCategories.position} = 0
      THEN ${transactions.amountMinor} % ${linkCount} ELSE 0 END)`.mapWith(Number);

/** Largest first. Deleted categories still appear: their past entries are part of the total. */
export function getCategoryBreakdown(
  db: Database,
  kind: BreakdownKind,
  range: DateRange,
): CategoryShare[] {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      amountMinor: shareMinor,
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(transactions)
    .innerJoin(transactionCategories, eq(transactionCategories.transactionId, transactions.id))
    .innerJoin(categories, eq(categories.id, transactionCategories.categoryId))
    .where(filterConditions({ type: kind, range }))
    .groupBy(categories.id)
    .orderBy(desc(shareMinor), categories.name)
    .all();
}

/** Income and expenses per source account; transfers are left out (they are not spending). */
export function getAccountActivity(db: Database, range: DateRange): AccountActivity[] {
  const incomeMinor = sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income'
    THEN ${transactions.amountMinor} END), 0)`.mapWith(Number);
  const expenseMinor = sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense'
    THEN ${transactions.amountMinor} END), 0)`.mapWith(Number);

  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      kind: accounts.kind,
      icon: accounts.icon,
      incomeMinor,
      expenseMinor,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(and(filterConditions({ range }), ne(transactions.type, 'transfer')))
    .groupBy(accounts.id)
    .orderBy(desc(expenseMinor), desc(incomeMinor))
    .all();
}

/** `count` months ending with the month of `monthStart`, oldest first. */
export function getMonthlyTotals(db: Database, monthStart: number, count: number): MonthTotals[] {
  const end = new Date(monthStart);
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(end.getFullYear(), end.getMonth() - (count - 1 - index), 1);
    const totals = getTransactionTotals(db, { range: getPeriodRange('month', month) });
    return {
      monthStart: month.getTime(),
      incomeMinor: totals.incomeMinor,
      expenseMinor: totals.expenseMinor,
    };
  });
}
