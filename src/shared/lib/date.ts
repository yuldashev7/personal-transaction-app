import { err, ok, type Result } from './result';

export type Period = 'today' | 'week' | 'month' | 'lastMonth';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Half-open interval `[start, end)` in Unix epoch milliseconds (UTC). */
export interface DateRange {
  readonly start: number;
  readonly end: number;
}

export type DateRangeError = 'invalid_date' | 'start_after_end';

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Period boundaries follow the device's local calendar, then are expressed as UTC timestamps. */
export function getPeriodRange(
  period: Period,
  now: Date = new Date(),
  weekStartsOn: Weekday = 1,
): DateRange {
  const today = startOfLocalDay(now);

  switch (period) {
    case 'today':
      return { start: today.getTime(), end: addLocalDays(today, 1).getTime() };
    case 'week': {
      const offset = (today.getDay() - weekStartsOn + 7) % 7;
      const start = addLocalDays(today, -offset);
      return { start: start.getTime(), end: addLocalDays(start, 7).getTime() };
    }
    case 'month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1).getTime(),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime(),
      };
    case 'lastMonth':
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime(),
        end: new Date(today.getFullYear(), today.getMonth(), 1).getTime(),
      };
  }
}

/** Both `from` and `to` days are included in full. */
export function getCustomRange(from: Date, to: Date): Result<DateRange, DateRangeError> {
  if (!isValidDate(from) || !isValidDate(to)) return err('invalid_date');

  const start = startOfLocalDay(from);
  const endDay = startOfLocalDay(to);
  if (start.getTime() > endDay.getTime()) return err('start_after_end');

  return ok({ start: start.getTime(), end: addLocalDays(endDay, 1).getTime() });
}

export function startOfLocalMonth(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

/** First day of the month `months` away (negative = earlier), at local midnight. */
export function shiftLocalMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth() + months, 1).getTime();
}

export function isSameLocalDay(a: number, b: number): boolean {
  return startOfLocalDay(new Date(a)).getTime() === startOfLocalDay(new Date(b)).getTime();
}

/** Moves a timestamp by whole calendar days, keeping the local time of day (DST-safe). */
export function shiftLocalDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const;

export function formatDayLabel(timestamp: number, now: number = Date.now()): string {
  if (isSameLocalDay(timestamp, now)) return 'Bugun';
  if (isSameLocalDay(timestamp, shiftLocalDays(now, -1))) return 'Kecha';

  const date = new Date(timestamp);
  const label = `${date.getDate()}-${MONTHS_UZ[date.getMonth()]}`;
  return date.getFullYear() === new Date(now).getFullYear()
    ? label
    : `${label}, ${date.getFullYear()}`;
}

export function formatMonthLabel(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  const month = MONTHS_UZ[date.getMonth()] ?? '';
  const label = month.charAt(0).toUpperCase() + month.slice(1);
  return date.getFullYear() === new Date(now).getFullYear()
    ? label
    : `${label} ${date.getFullYear()}`;
}

const MONTHS_UZ_SHORT = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyn',
  'Iyl',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
] as const;

/** Three-letter month for compact charts ("Iyn" / "Iyl" keep June and July apart). */
export function formatMonthShort(timestamp: number): string {
  return MONTHS_UZ_SHORT[new Date(timestamp).getMonth()] ?? '';
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function isValidTimestamp(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && isValidDate(new Date(value));
}
