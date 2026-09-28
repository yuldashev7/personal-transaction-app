import { formatChange, formatComparisonPeriod, getChange, getComparisonPeriod } from './comparison';

const at = (year: number, month: number, day: number, hour = 0) =>
  new Date(year, month - 1, day, hour).getTime();

describe('getComparisonPeriod', () => {
  it('compares the current month with the same days of the previous month', () => {
    const now = at(2026, 9, 28, 16);
    const period = getComparisonPeriod(at(2026, 9, 1), now);
    expect(period).toEqual({
      previous: { start: at(2026, 8, 1), end: at(2026, 8, 29) },
      previousMonthStart: at(2026, 8, 1),
      throughDay: 28,
    });
    expect(formatComparisonPeriod(period, now)).toBe('Avgustning 1–28-kunlari bilan');
  });

  it('uses the whole previous month when it is shorter than today’s date', () => {
    const period = getComparisonPeriod(at(2026, 3, 1), at(2026, 3, 31, 9));
    expect(period).toMatchObject({
      previous: { start: at(2026, 2, 1), end: at(2026, 3, 1) },
      throughDay: null,
    });
  });

  it('compares finished months in full, including across a year boundary', () => {
    const now = at(2026, 9, 28);
    const period = getComparisonPeriod(at(2026, 1, 1), now);
    expect(period).toEqual({
      previous: { start: at(2025, 12, 1), end: at(2026, 1, 1) },
      previousMonthStart: at(2025, 12, 1),
      throughDay: null,
    });
    expect(formatComparisonPeriod(period, now)).toBe('Dekabr 2025 oyi bilan');
  });
});

describe('getChange', () => {
  it('reports direction, rounded percent and difference', () => {
    expect(getChange(430_000_000, 500_000_000)).toEqual({
      kind: 'down',
      percent: 14,
      differenceMinor: 70_000_000,
    });
    expect(getChange(560_000_000, 500_000_000)).toEqual({
      kind: 'up',
      percent: 12,
      differenceMinor: 60_000_000,
    });
  });

  it('handles empty and unchanged months', () => {
    expect(getChange(0, 0)).toEqual({ kind: 'none' });
    expect(getChange(100, 0)).toEqual({ kind: 'new' });
    expect(getChange(0, 100)).toEqual({ kind: 'down', percent: 100, differenceMinor: 100 });
    expect(getChange(100, 100)).toEqual({ kind: 'same' });
  });
});

describe('formatChange', () => {
  it('reads naturally in Uzbek', () => {
    expect(formatChange(getChange(430, 500))).toBe('14% kam');
    expect(formatChange(getChange(560, 500))).toBe('12% koʻp');
    expect(formatChange(getChange(1001, 1000))).toBe('<1% koʻp');
    expect(formatChange(getChange(100, 0))).toBe('Oʻtgan oyda yoʻq edi');
    expect(formatChange(getChange(0, 0))).toBe('Ikkala oyda ham yoʻq');
    expect(formatChange(getChange(5, 5))).toBe('Oʻzgarmadi');
  });
});
