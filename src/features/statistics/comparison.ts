import type { DateRange } from '@/shared/lib/date';
import { formatMonthLabel, shiftLocalMonths, startOfLocalMonth } from '@/shared/lib/date';

export interface ComparisonPeriod {
  readonly previous: DateRange;
  readonly previousMonthStart: number;
  /** Last compared day of the previous month when the selected month is still in progress. */
  readonly throughDay: number | null;
}

/**
 * The period the selected month is compared with. A finished month is compared with the whole
 * previous month; the current month with the same days of the previous one (1–28 vs 1–28), capped
 * at the previous month's end (31 March → all of February).
 */
export function getComparisonPeriod(monthStart: number, now: number): ComparisonPeriod {
  const previousMonthStart = shiftLocalMonths(monthStart, -1);
  const fullPrevious = { start: previousMonthStart, end: monthStart };

  if (startOfLocalMonth(now) !== monthStart) {
    return { previous: fullPrevious, previousMonthStart, throughDay: null };
  }

  const today = new Date(now).getDate();
  const previous = new Date(previousMonthStart);
  const end = new Date(previous.getFullYear(), previous.getMonth(), today + 1).getTime();
  if (end >= monthStart) return { previous: fullPrevious, previousMonthStart, throughDay: null };

  return { previous: { start: previousMonthStart, end }, previousMonthStart, throughDay: today };
}

export type Change =
  | { readonly kind: 'none' }
  | { readonly kind: 'new' }
  | { readonly kind: 'same' }
  | {
      readonly kind: 'up' | 'down';
      /** Rounded percentage of the previous value; 0 means "less than 1%". */
      readonly percent: number;
      readonly differenceMinor: number;
    };

export function getChange(currentMinor: number, previousMinor: number): Change {
  if (previousMinor <= 0) return currentMinor > 0 ? { kind: 'new' } : { kind: 'none' };
  const difference = currentMinor - previousMinor;
  if (difference === 0) return { kind: 'same' };
  return {
    kind: difference > 0 ? 'up' : 'down',
    percent: Math.round((Math.abs(difference) / previousMinor) * 100),
    differenceMinor: Math.abs(difference),
  };
}

/** "12% koʻp" / "12% kam"; tiny changes read "<1%" instead of "0%". */
export function formatChange(change: Change): string {
  switch (change.kind) {
    case 'none':
      return 'Ikkala oyda ham yoʻq';
    case 'new':
      return 'Oʻtgan oyda yoʻq edi';
    case 'same':
      return 'Oʻzgarmadi';
    case 'up':
    case 'down': {
      const percent = change.percent === 0 ? '<1%' : `${change.percent}%`;
      return `${percent} ${change.kind === 'up' ? 'koʻp' : 'kam'}`;
    }
  }
}

export function formatComparisonPeriod(period: ComparisonPeriod, now: number): string {
  const month = formatMonthLabel(period.previousMonthStart, now);
  return period.throughDay === null
    ? `${month} oyi bilan`
    : `${month}ning 1–${period.throughDay}-kunlari bilan`;
}
