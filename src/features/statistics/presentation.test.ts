import { formatShare, getBarRatio } from './presentation';

describe('statistics presentation', () => {
  it('formats shares', () => {
    expect(formatShare(25, 100)).toBe('25%');
    expect(formatShare(1, 3)).toBe('33%');
    expect(formatShare(1, 1000)).toBe('<1%');
    expect(formatShare(0, 100)).toBe('0%');
    expect(formatShare(5, 0)).toBe('0%');
  });

  it('keeps tiny bars visible and empty bars empty', () => {
    expect(getBarRatio(50, 100)).toBe(0.5);
    expect(getBarRatio(1, 10_000)).toBe(0.02);
    expect(getBarRatio(0, 100)).toBe(0);
    expect(getBarRatio(10, 0)).toBe(0);
  });
});
