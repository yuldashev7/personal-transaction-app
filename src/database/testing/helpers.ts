import type { Result } from '@/shared/lib/result';

/** Wednesday, 2026-09-30 12:00 local time. */
export const TEST_NOW = new Date(2026, 8, 30, 12).getTime();

export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.ok) throw new Error(`Expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}
