import type { Database } from '@/database/client';
import { createTestDatabase } from '@/database/testing/createTestDatabase';
import { TEST_NOW as NOW, unwrap } from '@/database/testing/helpers';
import {
  getAccountsWithBalance,
  getAccountWithBalance,
  getTotalBalance,
} from '@/features/accounts/queries';
import { createAccount, setAccountArchived } from '@/features/accounts/repository';
import type { Account } from '@/features/accounts/types';
import { getCategories } from '@/features/categories/queries';
import { deleteCategory, setCategoryArchived } from '@/features/categories/repository';
import type { Category } from '@/features/categories/types';
import { getPeriodRange } from '@/shared/lib/date';

import {
  getLastUsedAccountId,
  getTransactionForEdit,
  getTransactionTotals,
  listTransactions,
} from './queries';
import {
  createTransaction,
  deleteTransaction,
  restoreTransaction,
  updateTransaction,
} from './repository';
import type { TransactionFilter, TransactionInput } from './types';
import { validateTransactionInput } from './validation';

const HOUR = 60 * 60 * 1000;

function expenseInput(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'expense',
    accountId: 'account',
    toAccountId: null,
    amount: '50 000',
    categoryIds: ['category'],
    note: '',
    occurredAt: NOW,
    ...overrides,
  };
}

describe('validateTransactionInput', () => {
  it('parses a valid expense and removes duplicate categories', () => {
    expect(
      validateTransactionInput(
        expenseInput({ categoryIds: ['a', 'b', 'a'], note: '  tushlik ' }),
        NOW,
      ),
    ).toEqual({
      ok: true,
      value: {
        type: 'expense',
        accountId: 'account',
        amountMinor: 5_000_000,
        categoryIds: ['a', 'b'],
        note: 'tushlik',
        occurredAt: NOW,
      },
    });
  });

  it('requires amount > 0, an account and at least one category', () => {
    expect(
      validateTransactionInput(
        expenseInput({ amount: '0', accountId: null, categoryIds: [] }),
        NOW,
      ),
    ).toEqual({
      ok: false,
      error: { amount: 'not_positive', accountId: 'required', categoryIds: 'required' },
    });
    expect(validateTransactionInput(expenseInput({ amount: '' }), NOW)).toMatchObject({
      error: { amount: 'required' },
    });
    expect(validateTransactionInput(expenseInput({ amount: '-5' }), NOW)).toMatchObject({
      error: { amount: 'not_positive' },
    });
    expect(validateTransactionInput(expenseInput({ amount: '5.555' }), NOW)).toMatchObject({
      error: { amount: 'too_many_decimals' },
    });
  });

  it('validates transfers', () => {
    const transfer = expenseInput({ type: 'transfer', categoryIds: [] });
    expect(validateTransactionInput(transfer, NOW)).toMatchObject({
      error: { toAccountId: 'required' },
    });
    expect(validateTransactionInput({ ...transfer, toAccountId: 'account' }, NOW)).toMatchObject({
      error: { toAccountId: 'same_account' },
    });
    expect(validateTransactionInput({ ...transfer, toAccountId: 'other' }, NOW)).toMatchObject({
      ok: true,
      value: { type: 'transfer', toAccountId: 'other' },
    });
  });

  it('validates note length and date', () => {
    expect(
      validateTransactionInput(
        expenseInput({ note: 'x'.repeat(201), occurredAt: NOW + 25 * HOUR }),
        NOW,
      ),
    ).toMatchObject({ error: { note: 'too_long', occurredAt: 'in_future' } });
    expect(validateTransactionInput(expenseInput({ occurredAt: Number.NaN }), NOW)).toMatchObject({
      error: { occurredAt: 'invalid' },
    });
  });
});

describe('transactions', () => {
  let db: Database;
  let tbc: Account;
  let uzum: Account;
  let uzcard: Account;
  let cash: Account;
  let expenseCategories: Category[];
  let incomeCategories: Category[];

  const byName = (list: Category[], name: string) => {
    const category = list.find((c) => c.name === name);
    if (!category) throw new Error(`No category ${name}`);
    return category;
  };

  const balances = () =>
    Object.fromEntries(getAccountsWithBalance(db).map((a) => [a.name, a.balanceMinor]));

  beforeEach(async () => {
    db = await createTestDatabase();
    const add = (name: string, kind: Account['kind'], initialBalance: string) =>
      unwrap(createAccount(db, { name, kind, initialBalance }, NOW));
    tbc = add('TBC', 'card', '5 000 000');
    uzum = add('Uzum', 'card', '3 000 000');
    uzcard = add('Uzcard', 'card', '2 000 000');
    cash = add('Naqd', 'cash', '500 000');
    expenseCategories = getCategories(db, { kind: 'expense' });
    incomeCategories = getCategories(db, { kind: 'income' });
  });

  it('keeps balances consistent through expense, income and transfer', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const water = byName(expenseCategories, 'Ichimlik');
    const salary = byName(incomeCategories, 'Maosh');

    unwrap(
      createTransaction(
        db,
        expenseInput({ accountId: uzum.id, categoryIds: [food.id, water.id] }),
        NOW,
      ),
    );
    unwrap(
      createTransaction(
        db,
        expenseInput({
          type: 'income',
          accountId: tbc.id,
          amount: '2 000 000',
          categoryIds: [salary.id],
          occurredAt: NOW + 1,
        }),
        NOW,
      ),
    );
    unwrap(
      createTransaction(
        db,
        expenseInput({
          type: 'transfer',
          accountId: tbc.id,
          toAccountId: cash.id,
          amount: '100 000',
          categoryIds: [],
          occurredAt: NOW + 2,
        }),
        NOW,
      ),
    );

    expect(balances()).toEqual({
      TBC: 690_000_000,
      Uzum: 295_000_000,
      Uzcard: 200_000_000,
      Naqd: 60_000_000,
    });
    expect(getTotalBalance(getAccountsWithBalance(db))).toBe(1_245_000_000);
    expect(getAccountWithBalance(db, tbc.id)?.balanceMinor).toBe(690_000_000);
    expect(getAccountWithBalance(db, cash.id)?.balanceMinor).toBe(60_000_000);
    expect(getAccountWithBalance(db, 'missing')).toBeUndefined();

    const [transfer, income, expense] = listTransactions(db);
    expect(expense).toMatchObject({
      type: 'expense',
      amountMinor: 5_000_000,
      account: { id: uzum.id, name: 'Uzum' },
      toAccount: null,
      categories: [
        { id: food.id, name: 'Oziq-ovqat' },
        { id: water.id, name: 'Ichimlik' },
      ],
    });
    expect(income).toMatchObject({ type: 'income', categories: [{ name: 'Maosh' }] });
    expect(transfer).toMatchObject({
      type: 'transfer',
      account: { name: 'TBC' },
      toAccount: { name: 'Naqd' },
      categories: [],
    });
  });

  it('checks references inside the database', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const salary = byName(incomeCategories, 'Maosh');

    expect(
      createTransaction(db, expenseInput({ accountId: 'missing', categoryIds: [food.id] }), NOW),
    ).toEqual({
      ok: false,
      error: { kind: 'validation', fields: { accountId: 'not_found' } },
    });
    expect(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [salary.id] }), NOW),
    ).toMatchObject({ error: { fields: { categoryIds: 'kind_mismatch' } } });
    expect(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: ['missing'] }), NOW),
    ).toMatchObject({ error: { fields: { categoryIds: 'not_found' } } });

    unwrap(setAccountArchived(db, uzcard.id, true, NOW));
    expect(
      createTransaction(db, expenseInput({ accountId: uzcard.id, categoryIds: [food.id] }), NOW),
    ).toMatchObject({ error: { fields: { accountId: 'archived' } } });

    expect(listTransactions(db)).toHaveLength(0);
  });

  it('updates amount, type, account and categories atomically', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const taxi = byName(expenseCategories, 'Taksi');
    const gift = byName(incomeCategories, 'Sovgʻa');
    const created = unwrap(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [food.id] }), NOW),
    );

    unwrap(
      updateTransaction(
        db,
        created.id,
        expenseInput({ accountId: tbc.id, amount: '30 000', categoryIds: [taxi.id, food.id] }),
        NOW + 1,
      ),
    );
    expect(getTransactionForEdit(db, created.id)).toMatchObject({
      transaction: { accountId: tbc.id, amountMinor: 3_000_000, updatedAt: NOW + 1 },
    });
    expect(getTransactionForEdit(db, created.id)?.categories.map((c) => c.id)).toEqual([
      taxi.id,
      food.id,
    ]);
    expect(balances()).toMatchObject({ TBC: 497_000_000, Uzum: 300_000_000 });

    expect(
      updateTransaction(
        db,
        created.id,
        expenseInput({ type: 'income', accountId: tbc.id, categoryIds: [food.id] }),
        NOW,
      ),
    ).toMatchObject({ error: { fields: { categoryIds: 'kind_mismatch' } } });

    unwrap(
      updateTransaction(
        db,
        created.id,
        expenseInput({ type: 'income', accountId: tbc.id, categoryIds: [gift.id] }),
        NOW,
      ),
    );
    expect(balances()).toMatchObject({ TBC: 505_000_000 });
  });

  it('allows keeping an archived category when editing, but not choosing a new one', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const coffee = byName(expenseCategories, 'Dorixona');
    const created = unwrap(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [food.id] }), NOW),
    );
    unwrap(setCategoryArchived(db, food.id, true, NOW));
    unwrap(setCategoryArchived(db, coffee.id, true, NOW));

    expect(
      updateTransaction(
        db,
        created.id,
        expenseInput({ accountId: uzum.id, amount: '1', categoryIds: [food.id] }),
        NOW,
      ),
    ).toMatchObject({ ok: true });
    expect(
      updateTransaction(
        db,
        created.id,
        expenseInput({ accountId: uzum.id, categoryIds: [coffee.id] }),
        NOW,
      ),
    ).toMatchObject({ error: { fields: { categoryIds: 'archived' } } });
  });

  it('keeps showing a deleted category on past transactions', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const created = unwrap(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [food.id] }), NOW),
    );

    unwrap(deleteCategory(db, food.id, NOW));

    expect(getCategories(db, { kind: 'expense' }).map((c) => c.id)).not.toContain(food.id);
    expect(listTransactions(db)[0]?.categories).toEqual([
      { id: food.id, name: 'Oziq-ovqat', icon: 'food' },
    ]);
    expect(getTransactionForEdit(db, created.id)?.categories).toEqual([
      { id: food.id, name: 'Oziq-ovqat', icon: 'food' },
    ]);
  });

  it('allows keeping a deleted category when editing, but not choosing it anew', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const water = byName(expenseCategories, 'Ichimlik');
    const created = unwrap(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [food.id] }), NOW),
    );
    unwrap(deleteCategory(db, food.id, NOW));
    unwrap(deleteCategory(db, water.id, NOW));

    expect(
      updateTransaction(
        db,
        created.id,
        expenseInput({ accountId: uzum.id, amount: '7 000', categoryIds: [food.id] }),
        NOW,
      ),
    ).toMatchObject({ ok: true });
    expect(
      updateTransaction(
        db,
        created.id,
        expenseInput({ accountId: uzum.id, categoryIds: [food.id, water.id] }),
        NOW,
      ),
    ).toMatchObject({ error: { fields: { categoryIds: 'not_found' } } });
    expect(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [food.id] }), NOW),
    ).toMatchObject({ error: { fields: { categoryIds: 'not_found' } } });
  });

  it('defaults to the account of the newest active transaction', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const entry = (accountId: string, occurredAt: number) =>
      unwrap(
        createTransaction(db, expenseInput({ accountId, categoryIds: [food.id], occurredAt }), NOW),
      );

    expect(getLastUsedAccountId(db)).toBeUndefined();

    entry(uzum.id, NOW - 2 * HOUR);
    const newest = entry(cash.id, NOW - HOUR);
    expect(getLastUsedAccountId(db)).toBe(cash.id);

    unwrap(deleteTransaction(db, newest.id, NOW));
    expect(getLastUsedAccountId(db)).toBe(uzum.id);

    unwrap(setAccountArchived(db, uzum.id, true, NOW));
    expect(getLastUsedAccountId(db)).toBeUndefined();
  });

  it('soft deletes and restores', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const created = unwrap(
      createTransaction(db, expenseInput({ accountId: uzum.id, categoryIds: [food.id] }), NOW),
    );

    unwrap(deleteTransaction(db, created.id, NOW));
    expect(listTransactions(db)).toHaveLength(0);
    expect(balances()).toMatchObject({ Uzum: 300_000_000 });
    expect(deleteTransaction(db, created.id)).toMatchObject({ error: { kind: 'not_found' } });

    unwrap(restoreTransaction(db, created.id, NOW));
    expect(listTransactions(db)[0]?.categories).toEqual([
      { id: food.id, name: 'Oziq-ovqat', icon: 'food' },
    ]);
    expect(balances()).toMatchObject({ Uzum: 295_000_000 });
    expect(restoreTransaction(db, created.id)).toMatchObject({ error: { kind: 'not_found' } });
  });

  it('paginates newest first with a stable cursor', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    for (let i = 0; i < 5; i++) {
      unwrap(
        createTransaction(
          db,
          expenseInput({
            accountId: uzum.id,
            categoryIds: [food.id],
            occurredAt: NOW - (i % 2) * HOUR,
          }),
          NOW,
        ),
      );
    }

    const firstPage = listTransactions(db, { limit: 2 });
    const last = firstPage.at(-1)!;
    const secondPage = listTransactions(db, {
      limit: 10,
      before: { occurredAt: last.occurredAt, id: last.id },
    });
    const all = [...firstPage, ...secondPage];

    expect(all).toHaveLength(5);
    expect(new Set(all.map((t) => t.id)).size).toBe(5);
    expect(all.map((t) => t.occurredAt)).toEqual([NOW, NOW, NOW, NOW - HOUR, NOW - HOUR]);
  });

  it('sums income and expenses for a period, excluding transfers and deleted rows', () => {
    const food = byName(expenseCategories, 'Oziq-ovqat');
    const salary = byName(incomeCategories, 'Maosh');
    const create = (input: Partial<TransactionInput>) =>
      unwrap(createTransaction(db, expenseInput({ accountId: uzum.id, ...input }), NOW));

    create({ categoryIds: [food.id] });
    create({ type: 'income', amount: '2 000 000', categoryIds: [salary.id] });
    create({ type: 'transfer', toAccountId: cash.id, amount: '100', categoryIds: [] });
    create({ categoryIds: [food.id], occurredAt: new Date(2026, 7, 31).getTime() });
    const removed = create({ categoryIds: [food.id], amount: '999' });
    unwrap(deleteTransaction(db, removed.id, NOW));

    expect(getTransactionTotals(db, { range: getPeriodRange('month', new Date(NOW)) })).toEqual({
      count: 3,
      incomeMinor: 200_000_000,
      expenseMinor: 5_000_000,
    });
    expect(
      getTransactionTotals(db, { range: getPeriodRange('today', new Date(NOW - 48 * HOUR)) }),
    ).toEqual({ count: 0, incomeMinor: 0, expenseMinor: 0 });
  });

  describe('filters', () => {
    const ids = (filter: TransactionFilter) =>
      listTransactions(db, { filter })
        .map((t) => t.note ?? t.amountMinor)
        .sort();

    beforeEach(() => {
      const food = byName(expenseCategories, 'Oziq-ovqat');
      const water = byName(expenseCategories, 'Ichimlik');
      const taxi = byName(expenseCategories, 'Taksi');
      const salary = byName(incomeCategories, 'Maosh');
      const create = (input: Partial<TransactionInput>) =>
        unwrap(createTransaction(db, expenseInput(input), NOW));

      create({ accountId: uzum.id, categoryIds: [food.id, water.id], note: 'tushlik' });
      create({ accountId: tbc.id, categoryIds: [taxi.id], amount: '30 000', note: 'taksi' });
      create({
        type: 'income',
        accountId: tbc.id,
        categoryIds: [salary.id],
        amount: '2 000 000',
        note: 'maosh',
      });
      create({
        type: 'transfer',
        accountId: uzum.id,
        toAccountId: cash.id,
        categoryIds: [],
        amount: '100 000',
        note: '100% naqdlashtirish',
      });
      create({
        accountId: cash.id,
        categoryIds: [food.id],
        note: 'bozor',
        occurredAt: new Date(2026, 7, 31).getTime(),
      });
    });

    it('filters by type, account (either side of a transfer) and any of the categories', () => {
      const water = byName(expenseCategories, 'Ichimlik');
      const taxi = byName(expenseCategories, 'Taksi');

      expect(ids({ type: 'expense' })).toEqual(['bozor', 'taksi', 'tushlik']);
      expect(ids({ accountId: cash.id })).toEqual(['100% naqdlashtirish', 'bozor']);
      expect(ids({ categoryIds: [water.id] })).toEqual(['tushlik']);
      expect(ids({ categoryIds: [water.id, taxi.id] })).toEqual(['taksi', 'tushlik']);
      expect(ids({ range: getPeriodRange('month', new Date(NOW)), type: 'expense' })).toEqual([
        'taksi',
        'tushlik',
      ]);
    });

    it('searches note, account and category names and the exact amount', () => {
      expect(ids({ search: 'TUSH' })).toEqual(['tushlik']);
      expect(ids({ search: ' ichim ' })).toEqual(['tushlik']);
      expect(ids({ search: 'naqd' })).toEqual(['100% naqdlashtirish', 'bozor']);
      expect(ids({ search: '30 000' })).toEqual(['taksi']);
      expect(ids({ search: '100%' })).toEqual(['100% naqdlashtirish']);
      expect(ids({ search: '%' })).toEqual(['100% naqdlashtirish']);
      expect(ids({ search: '_' })).toEqual([]);
      expect(ids({ search: '' })).toHaveLength(5);
    });

    it('finds a transfer by its destination account name alone', () => {
      unwrap(
        createTransaction(
          db,
          expenseInput({
            type: 'transfer',
            accountId: tbc.id,
            toAccountId: cash.id,
            categoryIds: [],
            amount: '7 000',
            note: '',
          }),
          NOW,
        ),
      );
      expect(ids({ search: cash.name })).toContain(700_000);
      expect(ids({ search: tbc.name })).toContain(700_000);
    });

    it('applies the same filter to totals', () => {
      expect(getTransactionTotals(db, { accountId: tbc.id })).toEqual({
        count: 2,
        incomeMinor: 200_000_000,
        expenseMinor: 3_000_000,
      });
      expect(getTransactionTotals(db, { search: 'naqd' })).toEqual({
        count: 2,
        incomeMinor: 0,
        expenseMinor: 5_000_000,
      });
    });

    it('pages through filtered results with the cursor', () => {
      const [first] = listTransactions(db, { limit: 1, filter: { type: 'expense' } });
      const rest = listTransactions(db, {
        filter: { type: 'expense' },
        before: first && { occurredAt: first.occurredAt, id: first.id },
      });
      expect(rest).toHaveLength(2);
      expect(rest.every((t) => t.type === 'expense' && t.id !== first?.id)).toBe(true);
    });
  });
});
