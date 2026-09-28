import { useState } from 'react';

import { getDatabase, type Database } from '@/database/client';
import { runInDatabase } from '@/database/errors';
import { useLiveQuery, useTableVersion } from '@/database/live-query';
import { accounts, categories, transactionCategories, transactions } from '@/database/schema';
import { getPeriodRange } from '@/shared/lib/date';
import type { AppError } from '@/shared/lib/errors';
import { ok, type Result } from '@/shared/lib/result';

import {
  DEFAULT_PAGE_SIZE,
  getLastUsedAccountId,
  getTransactionForEdit,
  getTransactionTotals,
  listTransactions,
} from './queries';
import type { TransactionFilter, TransactionListItem } from './types';

const LAST_USED_TABLES = [transactions, accounts];
const LIST_TABLES = [transactions, transactionCategories, categories, accounts];

export function useLastUsedAccountId() {
  const db = getDatabase();
  return useLiveQuery(() => getLastUsedAccountId(db) ?? null, LAST_USED_TABLES);
}

export function useRecentTransactions(limit: number) {
  const db = getDatabase();
  return useLiveQuery(() => listTransactions(db, { limit }), LIST_TABLES);
}

interface FeedState {
  readonly version: number;
  readonly filterKey: string;
  readonly result: Result<TransactionListItem[], AppError>;
  readonly hasMore: boolean;
}

function readWindow(
  db: Database,
  filter: TransactionFilter,
  version: number,
  limit: number,
): FeedState {
  const result = runInDatabase(() => ok(listTransactions(db, { limit, filter })));
  return {
    version,
    filterKey: JSON.stringify(filter),
    result,
    hasMore: result.ok && result.value.length >= limit,
  };
}

export function useTransactionFeed(
  filter: TransactionFilter,
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  const db = getDatabase();
  const version = useTableVersion(LIST_TABLES);
  const filterKey = JSON.stringify(filter);
  const [state, setState] = useState(() => readWindow(db, filter, version, pageSize));

  let current = state;
  if (state.filterKey !== filterKey) {
    current = readWindow(db, filter, version, pageSize);
    setState(current);
  } else if (state.version !== version) {
    const loaded = state.result.ok ? state.result.value.length : 0;
    current = readWindow(db, filter, version, Math.max(loaded, pageSize));
    setState(current);
  }

  const loadMore = () => {
    if (!current.result.ok || !current.hasMore) return;
    const items = current.result.value;
    const last = items.at(-1);
    const next = runInDatabase(() =>
      ok(
        listTransactions(db, {
          limit: pageSize,
          filter,
          before: last && { occurredAt: last.occurredAt, id: last.id },
        }),
      ),
    );
    setState({
      ...current,
      result: next.ok ? ok([...items, ...next.value]) : current.result,
      hasMore: next.ok && next.value.length >= pageSize,
    });
  };

  return { result: current.result, loadMore };
}

export function useTransactionTotals(filter: TransactionFilter) {
  const db = getDatabase();
  return useLiveQuery(() => getTransactionTotals(db, filter), LIST_TABLES);
}

export function useTransactionForEdit(id: string) {
  const db = getDatabase();
  return useLiveQuery(() => getTransactionForEdit(db, id) ?? null, LIST_TABLES);
}

export function useMonthTotals() {
  const db = getDatabase();
  return useLiveQuery(() => {
    const range = getPeriodRange('month');
    return { ...getTransactionTotals(db, { range }), monthStart: range.start };
  }, [transactions]);
}
