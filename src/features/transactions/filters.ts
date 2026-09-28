import { getCustomRange, getPeriodRange, type DateRange, type Period } from '@/shared/lib/date';

import type { TransactionFilter, TransactionType } from './types';

export type PeriodPreset = 'all' | Period | 'custom';

export const PERIOD_OPTIONS: readonly { readonly preset: PeriodPreset; readonly label: string }[] =
  [
    { preset: 'all', label: 'Barcha vaqt' },
    { preset: 'today', label: 'Bugun' },
    { preset: 'week', label: 'Shu hafta' },
    { preset: 'month', label: 'Shu oy' },
    { preset: 'lastMonth', label: 'Oʻtgan oy' },
    { preset: 'custom', label: 'Oraliq' },
  ];

/** What the filter panel edits. Converted to a query filter with `toTransactionFilter`. */
export interface TransactionFilterState {
  readonly search: string;
  readonly period: PeriodPreset;
  /** Used when `period` is `custom`; both days are included. */
  readonly from: number;
  readonly to: number;
  readonly type: TransactionType | null;
  readonly accountId: string | null;
  readonly categoryIds: readonly string[];
}

export function createFilterState(now: number): TransactionFilterState {
  return {
    search: '',
    period: 'all',
    from: now,
    to: now,
    type: null,
    accountId: null,
    categoryIds: [],
  };
}

export type FilterRangeError = 'start_after_end';

export function getFilterRange(
  state: TransactionFilterState,
  now: number,
): { range?: DateRange; error?: FilterRangeError } {
  if (state.period === 'all') return {};
  if (state.period !== 'custom') return { range: getPeriodRange(state.period, new Date(now)) };

  const custom = getCustomRange(new Date(state.from), new Date(state.to));
  if (custom.ok) return { range: custom.value };
  // An invalid range shows an error and matches nothing, instead of silently showing everything.
  return { range: { start: 0, end: 0 }, error: 'start_after_end' };
}

export function toTransactionFilter(state: TransactionFilterState, now: number): TransactionFilter {
  const { range } = getFilterRange(state, now);
  const search = state.search.trim();
  return {
    ...(search && { search }),
    ...(range && { range }),
    ...(state.type && { type: state.type }),
    ...(state.accountId && { accountId: state.accountId }),
    ...(state.type !== 'transfer' &&
      state.categoryIds.length > 0 && { categoryIds: state.categoryIds }),
  };
}

/** Criteria hidden in the collapsible panel (search and period are always visible). */
export function countPanelFilters(state: TransactionFilterState): number {
  return (
    (state.type ? 1 : 0) +
    (state.accountId ? 1 : 0) +
    (state.type !== 'transfer' && state.categoryIds.length > 0 ? 1 : 0)
  );
}

export function hasActiveFilters(state: TransactionFilterState): boolean {
  return state.search.trim() !== '' || state.period !== 'all' || countPanelFilters(state) > 0;
}
