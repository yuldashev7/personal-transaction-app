/** "34%"; a non-zero share that rounds to zero is shown as "<1%" rather than "0%". */
export function formatShare(partMinor: number, totalMinor: number): string {
  if (totalMinor <= 0 || partMinor <= 0) return '0%';
  const percent = Math.round((partMinor / totalMinor) * 100);
  return percent === 0 ? '<1%' : `${percent}%`;
}

/** Bar length as a fraction of the largest value, with a visible minimum for tiny non-zero values. */
export function getBarRatio(value: number, max: number, minRatio = 0.02): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(value / max, minRatio);
}
