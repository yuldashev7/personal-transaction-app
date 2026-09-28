import { formatMoney, MAX_AMOUNT_MINOR, parseMoney } from './money';

const NBSP = '\u00A0';

describe('parseMoney', () => {
  it.each([
    ['50000', 5_000_000],
    ['50 000', 5_000_000],
    [`2${NBSP}000${NBSP}000`, 200_000_000],
    ['1250,5', 125_050],
    ['1250.55', 125_055],
    ['5.', 500],
    ['0', 0],
    ['007', 700],
    ['-300', -30_000],
    ['-0', 0],
  ])('parses %j into %d minor units', (input, expected) => {
    expect(parseMoney(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['abc', 'invalid'],
    ['12a', 'invalid'],
    ['1,000,000', 'invalid'],
    [',5', 'invalid'],
    ['+5', 'invalid'],
    ['1e5', 'invalid'],
    ['50.000', 'too_many_decimals'],
    ['1,234', 'too_many_decimals'],
    ['99999999999999999', 'too_large'],
  ])('rejects %j with %s', (input, error) => {
    expect(parseMoney(input)).toEqual({ ok: false, error });
  });

  it('accepts the maximum amount and rejects anything above it', () => {
    const maxMajor = String(MAX_AMOUNT_MINOR / 100);
    expect(parseMoney(maxMajor)).toEqual({ ok: true, value: MAX_AMOUNT_MINOR });
    expect(parseMoney(`${maxMajor},01`)).toEqual({ ok: false, error: 'too_large' });
  });
});

describe('formatMoney', () => {
  it('groups thousands and appends the currency code', () => {
    expect(formatMoney(5_000_000)).toBe(`50${NBSP}000${NBSP}UZS`);
    expect(formatMoney(200_000_000)).toBe(`2${NBSP}000${NBSP}000${NBSP}UZS`);
    expect(formatMoney(0)).toBe(`0${NBSP}UZS`);
  });

  it('shows fraction digits only when they are non-zero', () => {
    expect(formatMoney(125_050)).toBe(`1${NBSP}250,50${NBSP}UZS`);
    expect(formatMoney(5)).toBe(`0,05${NBSP}UZS`);
  });

  it('handles sign display modes', () => {
    expect(formatMoney(-5_000_000)).toBe(`-50${NBSP}000${NBSP}UZS`);
    expect(formatMoney(200_000_000, 'UZS', { signDisplay: 'always' })).toBe(
      `+2${NBSP}000${NBSP}000${NBSP}UZS`,
    );
    expect(formatMoney(-5_000_000, 'UZS', { signDisplay: 'never' })).toBe(`50${NBSP}000${NBSP}UZS`);
    expect(formatMoney(0, 'UZS', { signDisplay: 'always' })).toBe(`0${NBSP}UZS`);
  });

  it('can omit the currency code', () => {
    expect(formatMoney(5_000_000, 'UZS', { showCurrency: false })).toBe(`50${NBSP}000`);
  });

  it('round-trips with parseMoney', () => {
    for (const minor of [0, 5, 125_050, 5_000_000, MAX_AMOUNT_MINOR]) {
      const text = formatMoney(minor, 'UZS', { showCurrency: false });
      expect(parseMoney(text)).toEqual({ ok: true, value: minor });
    }
  });
});
