import { getDatabase } from '@/database/client';
import { useLiveQuery } from '@/database/live-query';
import { accounts, categories, transactionCategories, transactions } from '@/database/schema';
import { getTransactionTotals } from '@/features/transactions/queries';
import { getPeriodRange } from '@/shared/lib/date';

import { getComparisonPeriod } from './comparison';
import { getAccountActivity, getCategoryBreakdown, getMonthlyTotals } from './queries';
import type { BreakdownKind } from './types';

/** Names and icons are shown next to the numbers, so renames refresh the screen too. */
const STATS_TABLES = [transactions, transactionCategories, categories, accounts];

export const CHART_MONTHS = 6;

/** Everything the statistics screen shows for one month, read in one pass. */
export function useMonthStatistics(monthStart: number, kind: BreakdownKind, now: number) {
  const db = getDatabase();
  return useLiveQuery(() => {
    const range = getPeriodRange('month', new Date(monthStart));
    const comparison = getComparisonPeriod(monthStart, now);
    return {
      totals: getTransactionTotals(db, { range }),
      comparison,
      previousTotals: getTransactionTotals(db, { range: comparison.previous }),
      categories: getCategoryBreakdown(db, kind, range),
      accounts: getAccountActivity(db, range),
      months: getMonthlyTotals(db, monthStart, CHART_MONTHS),
    };
  }, STATS_TABLES);
}
