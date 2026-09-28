import { getTableName, type Table } from 'drizzle-orm';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';

import { ok, type Result } from '@/shared/lib/result';
import type { AppError } from '@/shared/lib/errors';

import { runInDatabase } from './errors';

const refreshListeners = new Set<() => void>();

/** Re-runs every mounted live query (pull-to-refresh), e.g. to pick up a new day or month. */
function refreshLiveQueries(): void {
  refreshListeners.forEach((listener) => listener());
}

/**
 * A counter that increases whenever any of `tables` changes or `refreshLiveQueries` is called.
 * Row-level change events are coalesced into one update per frame.
 */
export function useTableVersion(tables: readonly Table[]): number {
  const [version, setVersion] = useState(0);
  const tableKey = tables.map((table) => getTableName(table)).join(',');

  useEffect(() => {
    const watched = new Set(tableKey.split(','));
    let frame: number | null = null;

    const bump = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setVersion((value) => value + 1);
      });
    };

    const subscription = addDatabaseChangeListener((event) => {
      if (watched.has(event.tableName)) bump();
    });
    refreshListeners.add(bump);

    return () => {
      subscription.remove();
      refreshListeners.delete(bump);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [tableKey]);

  return version;
}

/** Keeps the spinner visible briefly: local reads finish instantly and a flash looks broken. */
const MIN_REFRESH_MS = 500;

export interface PullToRefresh {
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}

/** `onRefresh` runs alongside the query refresh, e.g. to move a frozen "now" forward. */
export function usePullToRefresh(onRefresh?: () => void): PullToRefresh {
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!refreshing) return;
    const timer = setTimeout(() => setRefreshing(false), MIN_REFRESH_MS);
    return () => clearTimeout(timer);
  }, [refreshing]);

  const refresh = () => {
    setRefreshing(true);
    onRefresh?.();
    refreshLiveQueries();
  };

  return { refreshing, onRefresh: refresh };
}

/**
 * Runs a synchronous query and re-runs it whenever any of `tables` changes.
 * Unlike Drizzle's `useLiveQuery`, it watches every table the query depends on — e.g. account
 * balances must refresh when `transactions` change.
 */
export function useLiveQuery<T>(query: () => T, tables: readonly Table[]): Result<T, AppError> {
  // React Compiler drops `version` from the memo deps (it is not read by the computation),
  // which would freeze the result until `query` changes identity.
  'use no memo';
  const version = useTableVersion(tables);

  return useMemo(() => {
    void version;
    return runInDatabase(() => ok(query()));
  }, [query, version]);
}
