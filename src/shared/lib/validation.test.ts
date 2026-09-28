import { NAME_MAX_LENGTH, normalizeName, validateName } from './validation';

describe('validateName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeName('  TBC   karta ')).toBe('TBC karta');
    expect(validateName('  Naqd ')).toEqual({ ok: true, value: 'Naqd' });
  });

  it('rejects empty and too long names', () => {
    expect(validateName('   ')).toEqual({ ok: false, error: 'required' });
    expect(validateName('a'.repeat(NAME_MAX_LENGTH + 1))).toEqual({ ok: false, error: 'too_long' });
  });

  it('counts characters, not UTF-16 units', () => {
    expect(validateName('💳'.repeat(NAME_MAX_LENGTH)).ok).toBe(true);
  });
});
