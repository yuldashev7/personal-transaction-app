import type { Database } from '@/database/client';
import { createTestDatabase } from '@/database/testing/createTestDatabase';
import { TEST_NOW as NOW, unwrap } from '@/database/testing/helpers';
import { getCategories } from '@/features/categories/queries';
import { createTransaction } from '@/features/transactions/repository';

import { getAccountById, getAccountsWithBalance, getTotalBalance } from './queries';
import { createAccount, deleteAccount, setAccountArchived, updateAccount } from './repository';
import type { Account, AccountInput } from './types';
import { validateAccountInput } from './validation';

function addAccount(db: Database, input: Partial<AccountInput> = {}): Account {
  return unwrap(
    createAccount(db, { name: 'TBC', kind: 'card', initialBalance: '', ...input }, NOW),
  );
}

describe('validateAccountInput', () => {
  it('normalizes a valid input', () => {
    expect(
      validateAccountInput({ name: ' Uzum ', kind: 'card', initialBalance: '3 000 000' }),
    ).toEqual({
      ok: true,
      value: { name: 'Uzum', kind: 'card', initialBalanceMinor: 300_000_000, cardNumber: null },
    });
  });

  it('keeps only card number digits, without any other checks', () => {
    const card = (cardNumber: string, kind: AccountInput['kind'] = 'card') =>
      validateAccountInput({ name: 'Uzum', kind, initialBalance: '', cardNumber });

    expect(card('8600 1234-5678 9012')).toMatchObject({
      value: { cardNumber: '8600123456789012' },
    });
    expect(card('12')).toMatchObject({ value: { cardNumber: '12' } });
    expect(card('1'.repeat(25))).toMatchObject({ value: { cardNumber: '1'.repeat(19) } });
    expect(card('  ')).toMatchObject({ value: { cardNumber: null } });
    expect(card('8600 1234', 'cash')).toMatchObject({ value: { cardNumber: null } });
  });

  it('treats an empty initial balance as zero and allows negative balances', () => {
    expect(validateAccountInput({ name: 'Naqd', kind: 'cash', initialBalance: ' ' })).toMatchObject(
      {
        value: { initialBalanceMinor: 0 },
      },
    );
    expect(
      validateAccountInput({ name: 'Kredit', kind: 'card', initialBalance: '-500' }),
    ).toMatchObject({ value: { initialBalanceMinor: -50_000 } });
  });

  it('reports every invalid field', () => {
    expect(
      validateAccountInput({ name: '', kind: 'bank' as Account['kind'], initialBalance: 'abc' }),
    ).toEqual({
      ok: false,
      error: { name: 'required', kind: 'invalid_kind', initialBalance: 'invalid' },
    });
  });
});

describe('account repository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDatabase();
  });

  it('creates accounts in order', () => {
    const tbc = addAccount(db, { name: 'TBC', initialBalance: '5 000 000' });
    const cash = addAccount(db, { name: 'Naqd', kind: 'cash' });

    expect(tbc).toMatchObject({ initialBalanceMinor: 500_000_000, sortOrder: 0, createdAt: NOW });
    expect(cash.sortOrder).toBe(1);
  });

  it('rejects duplicate names case-insensitively', () => {
    addAccount(db, { name: 'TBC' });
    expect(createAccount(db, { name: 'tbc', kind: 'card', initialBalance: '' })).toEqual({
      ok: false,
      error: { kind: 'validation', fields: { name: 'duplicate' } },
    });
  });

  it('returns validation errors without touching the database', () => {
    expect(createAccount(db, { name: '  ', kind: 'card', initialBalance: '' })).toEqual({
      ok: false,
      error: { kind: 'validation', fields: { name: 'required' } },
    });
    expect(getAccountsWithBalance(db)).toHaveLength(0);
  });

  it('updates an account and reports missing ones', () => {
    const account = addAccount(db);
    const updated = unwrap(
      updateAccount(
        db,
        account.id,
        { name: 'TBC Bank', kind: 'card', initialBalance: '10' },
        NOW + 1,
      ),
    );
    expect(updated).toMatchObject({
      name: 'TBC Bank',
      initialBalanceMinor: 1000,
      updatedAt: NOW + 1,
    });

    expect(updateAccount(db, 'missing', { name: 'X', kind: 'card', initialBalance: '' })).toEqual({
      ok: false,
      error: { kind: 'not_found', entity: 'account', id: 'missing' },
    });
  });

  it('stores an optional card number and clears it', () => {
    const account = addAccount(db, { cardNumber: '8600 1234 5678 9012' });
    expect(getAccountById(db, account.id)?.cardNumber).toBe('8600123456789012');
    expect(addAccount(db, { name: 'Uzum' }).cardNumber).toBeNull();

    unwrap(
      updateAccount(db, account.id, {
        name: 'TBC',
        kind: 'card',
        initialBalance: '',
        cardNumber: '',
      }),
    );
    expect(getAccountById(db, account.id)?.cardNumber).toBeNull();
  });

  it('archives and unarchives', () => {
    const account = addAccount(db);
    unwrap(setAccountArchived(db, account.id, true, NOW));
    expect(getAccountsWithBalance(db)).toHaveLength(0);
    expect(getAccountsWithBalance(db, { includeArchived: true })).toHaveLength(1);

    unwrap(setAccountArchived(db, account.id, false, NOW));
    expect(getAccountsWithBalance(db)).toHaveLength(1);
  });

  it('deletes only unused accounts, and frees the name', () => {
    const unused = addAccount(db, { name: 'Eski' });
    expect(deleteAccount(db, unused.id, NOW)).toEqual({ ok: true, value: undefined });
    expect(getAccountById(db, unused.id)).toBeUndefined();
    addAccount(db, { name: 'Eski' });

    const used = addAccount(db, { name: 'TBC' });
    const [food] = getCategories(db, { kind: 'expense' });
    unwrap(
      createTransaction(
        db,
        {
          type: 'expense',
          accountId: used.id,
          toAccountId: null,
          amount: '1000',
          categoryIds: [food!.id],
          note: '',
          occurredAt: NOW,
        },
        NOW,
      ),
    );
    expect(deleteAccount(db, used.id, NOW)).toMatchObject({
      ok: false,
      error: { kind: 'constraint', constraint: 'foreign_key' },
    });
  });
});

describe('account balances', () => {
  it('starts from the initial balance and totals only active accounts', async () => {
    const db = await createTestDatabase();
    addAccount(db, { name: 'TBC', initialBalance: '5 000 000' });
    addAccount(db, { name: 'Uzum', initialBalance: '3 000 000' });
    const archived = addAccount(db, { name: 'Eski', initialBalance: '100' });
    unwrap(setAccountArchived(db, archived.id, true, NOW));

    const list = getAccountsWithBalance(db, { includeArchived: true });
    expect(list.map((a) => [a.name, a.balanceMinor])).toEqual([
      ['TBC', 500_000_000],
      ['Uzum', 300_000_000],
      ['Eski', 10_000],
    ]);
    expect(getTotalBalance(list)).toBe(800_000_000);
  });
});
