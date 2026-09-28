import {
  formatDayLabel,
  formatMonthLabel,
  formatMonthShort,
  getCustomRange,
  getPeriodRange,
  isSameLocalDay,
  isValidTimestamp,
  shiftLocalDays,
  shiftLocalMonths,
  startOfLocalMonth,
} from './date';

const local = (year: number, month: number, day: number, hour = 0) =>
  new Date(year, month - 1, day, hour).getTime();

describe('getPeriodRange', () => {
  // Wednesday, 2026-09-30 15:00 local time
  const now = new Date(2026, 8, 30, 15);

  it('returns the current local day', () => {
    expect(getPeriodRange('today', now)).toEqual({
      start: local(2026, 9, 30),
      end: local(2026, 10, 1),
    });
  });

  it('returns the current week starting on Monday by default', () => {
    expect(getPeriodRange('week', now)).toEqual({
      start: local(2026, 9, 28),
      end: local(2026, 10, 5),
    });
  });

  it('supports a Sunday week start', () => {
    expect(getPeriodRange('week', now, 0)).toEqual({
      start: local(2026, 9, 27),
      end: local(2026, 10, 4),
    });
  });

  it('treats the week start day itself as the first day', () => {
    const monday = new Date(2026, 8, 28, 0, 0);
    expect(getPeriodRange('week', monday).start).toBe(local(2026, 9, 28));
  });

  it('returns the current month across year boundaries', () => {
    expect(getPeriodRange('month', now)).toEqual({
      start: local(2026, 9, 1),
      end: local(2026, 10, 1),
    });
    expect(getPeriodRange('month', new Date(2026, 11, 31, 23))).toEqual({
      start: local(2026, 12, 1),
      end: local(2027, 1, 1),
    });
  });

  it('returns the previous month across year boundaries', () => {
    expect(getPeriodRange('lastMonth', now)).toEqual({
      start: local(2026, 8, 1),
      end: local(2026, 9, 1),
    });
    expect(getPeriodRange('lastMonth', new Date(2027, 0, 15))).toEqual({
      start: local(2026, 12, 1),
      end: local(2027, 1, 1),
    });
  });
});

describe('getCustomRange', () => {
  it('includes both boundary days in full', () => {
    expect(getCustomRange(new Date(2026, 8, 1, 18), new Date(2026, 8, 10, 9))).toEqual({
      ok: true,
      value: { start: local(2026, 9, 1), end: local(2026, 9, 11) },
    });
  });

  it('allows a single-day range', () => {
    const day = new Date(2026, 8, 15, 12);
    expect(getCustomRange(day, day)).toEqual({
      ok: true,
      value: { start: local(2026, 9, 15), end: local(2026, 9, 16) },
    });
  });

  it('rejects reversed and invalid ranges', () => {
    expect(getCustomRange(new Date(2026, 8, 10), new Date(2026, 8, 1))).toEqual({
      ok: false,
      error: 'start_after_end',
    });
    expect(getCustomRange(new Date(Number.NaN), new Date())).toEqual({
      ok: false,
      error: 'invalid_date',
    });
  });
});

describe('day helpers', () => {
  const now = local(2026, 9, 28, 14);

  it('shifts by calendar days and keeps the time of day', () => {
    expect(shiftLocalDays(now, -1)).toBe(local(2026, 9, 27, 14));
    expect(shiftLocalDays(local(2026, 3, 1, 9), -1)).toBe(local(2026, 2, 28, 9));
    expect(shiftLocalDays(now, 3)).toBe(local(2026, 10, 1, 14));
  });

  it('moves between month starts across years', () => {
    expect(startOfLocalMonth(now)).toBe(local(2026, 9, 1));
    expect(shiftLocalMonths(local(2026, 1, 31, 10), -1)).toBe(local(2025, 12, 1));
    expect(shiftLocalMonths(local(2026, 12, 15), 1)).toBe(local(2027, 1, 1));
  });

  it('compares local days', () => {
    expect(isSameLocalDay(local(2026, 9, 28, 0), local(2026, 9, 28, 23))).toBe(true);
    expect(isSameLocalDay(local(2026, 9, 28, 23), local(2026, 9, 29, 0))).toBe(false);
  });

  it('formats day labels in Uzbek', () => {
    expect(formatDayLabel(local(2026, 9, 28, 1), now)).toBe('Bugun');
    expect(formatDayLabel(local(2026, 9, 27, 23), now)).toBe('Kecha');
    expect(formatDayLabel(local(2026, 9, 25), now)).toBe('25-sentabr');
    expect(formatDayLabel(local(2025, 1, 3), now)).toBe('3-yanvar, 2025');
  });

  it('formats month labels in Uzbek', () => {
    expect(formatMonthLabel(local(2026, 9, 1), now)).toBe('Sentabr');
    expect(formatMonthLabel(local(2025, 12, 31), now)).toBe('Dekabr 2025');
    expect(formatMonthShort(local(2026, 6, 1))).toBe('Iyn');
    expect(formatMonthShort(local(2026, 7, 1))).toBe('Iyl');
  });
});

describe('isValidTimestamp', () => {
  it('accepts safe non-negative integers', () => {
    expect(isValidTimestamp(0)).toBe(true);
    expect(isValidTimestamp(local(2026, 9, 28, 14))).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isValidTimestamp(-1)).toBe(false);
    expect(isValidTimestamp(1.5)).toBe(false);
    expect(isValidTimestamp(Number.NaN)).toBe(false);
    expect(isValidTimestamp(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidTimestamp(9e15)).toBe(false);
  });
});
