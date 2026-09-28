import {
  countPanelFilters,
  createFilterState,
  getFilterRange,
  hasActiveFilters,
  toTransactionFilter,
} from './filters';

const local = (year: number, month: number, day: number, hour = 0) =>
  new Date(year, month - 1, day, hour).getTime();

describe('transaction filter state', () => {
  const now = local(2026, 9, 28, 14);
  const empty = createFilterState(now);

  it('starts with no criteria', () => {
    expect(toTransactionFilter(empty, now)).toEqual({});
    expect(hasActiveFilters(empty)).toBe(false);
    expect(countPanelFilters(empty)).toBe(0);
    expect(hasActiveFilters({ ...empty, search: '   ' })).toBe(false);
  });

  it('converts presets and custom ranges', () => {
    expect(toTransactionFilter({ ...empty, period: 'month' }, now).range).toEqual({
      start: local(2026, 9, 1),
      end: local(2026, 10, 1),
    });
    expect(
      toTransactionFilter(
        { ...empty, period: 'custom', from: local(2026, 9, 10, 18), to: local(2026, 9, 12, 9) },
        now,
      ).range,
    ).toEqual({ start: local(2026, 9, 10), end: local(2026, 9, 13) });
  });

  it('matches nothing and reports an error for a reversed custom range', () => {
    const reversed = {
      ...empty,
      period: 'custom' as const,
      from: local(2026, 9, 20),
      to: local(2026, 9, 10),
    };
    expect(getFilterRange(reversed, now)).toEqual({
      range: { start: 0, end: 0 },
      error: 'start_after_end',
    });
  });

  it('drops categories for transfers and trims the search', () => {
    const state = {
      ...empty,
      search: '  tushlik ',
      type: 'transfer' as const,
      accountId: 'uzum',
      categoryIds: ['food'],
    };
    expect(toTransactionFilter(state, now)).toEqual({
      search: 'tushlik',
      type: 'transfer',
      accountId: 'uzum',
    });
    expect(countPanelFilters(state)).toBe(2);
    expect(countPanelFilters({ ...state, type: 'expense' })).toBe(3);
  });
});
