import { notFoundError } from '@/shared/lib/errors';

import {
  formatCardNumber,
  getAccountErrorMessage,
  getAccountFieldMessage,
  getAccountIcon,
  getAccountKindLabel,
} from './presentation';

describe('account presentation', () => {
  it('groups card number digits by four', () => {
    expect(formatCardNumber('8600123456789012')).toBe('8600 1234 5678 9012');
    expect(formatCardNumber('8600 12')).toBe('8600 12');
    expect(formatCardNumber('8600')).toBe('8600');
    expect(formatCardNumber('86a0-1')).toBe('8601');
    expect(formatCardNumber('')).toBe('');
  });

  it('maps known field error codes and ignores unknown ones', () => {
    expect(getAccountFieldMessage('duplicate')).toBe('Bu nomli hisob allaqachon bor');
    expect(getAccountFieldMessage('required')).toBe('Nomini kiriting');
    expect(getAccountFieldMessage(undefined)).toBeUndefined();
    expect(getAccountFieldMessage('toString')).toBeUndefined();
  });

  it('explains why an account in use cannot be deleted, and never leaks technical details', () => {
    expect(
      getAccountErrorMessage({
        kind: 'constraint',
        constraint: 'foreign_key',
        cause: 'account_has_transactions',
      }),
    ).toContain('arxivlang');

    const generic = getAccountErrorMessage({
      kind: 'database',
      cause: new Error('SQLITE_BUSY: database is locked'),
    });
    expect(generic).not.toContain('SQLITE');
    expect(getAccountErrorMessage(notFoundError('account', 'x'))).toContain('topilmadi');
  });

  it('labels kinds and picks an icon from the kind unless a valid custom icon is set', () => {
    expect(getAccountKindLabel('cash')).toBe('Naqd');
    expect(getAccountIcon({ kind: 'cash', icon: null })).toBe('cash');
    expect(getAccountIcon({ kind: 'card', icon: 'gift' })).toBe('gift');
    expect(getAccountIcon({ kind: 'card', icon: 'unknown-key' })).toBe('other');
  });
});
