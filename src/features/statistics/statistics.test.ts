import type { Database } from '@/database/client';
import { createTestDatabase } from '@/database/testing/createTestDatabase';
import { TEST_NOW as NOW, unwrap } from '@/database/testing/helpers';
import { createAccount } from '@/features/accounts/repository';
import type { Account } from '@/features/accounts/types';
import { getCategories } from '@/features/categories/queries';
import { deleteCategory } from '@/features/categories/repository';
import type { Category } from '@/features/categories/types';
import { createTransaction, deleteTransaction } from '@/features/transactions/repository';
import type { TransactionInput } from '@/features/transactions/types';
import { getPeriodRange, startOfLocalMonth } from '@/shared/lib/date';

import { getAccountActivity, getCategoryBreakdown, getMonthlyTotals } from './queries';

describe('statistics', () => {
  let db: Database;
  let tbc: Account;
  let uzum: Account;
  let cash: Account;
  let expense: Category[];
  let income: Category[];
  const month = getPeriodRange('month', new Date(NOW));

  const byName = (list: Category[], name: string) => {
    const category = list.find((c) => c.name === name);
    if (!category) throw new Error(`No category ${name}`);
    return category;
  };

  const add = (input: Partial<TransactionInput>) =>
    unwrap(
      createTransaction(
        db,
        {
          type: 'expense',
          accountId: uzum.id,
          toAccountId: null,
          amount: '50 000',
          categoryIds: [],
          note: '',
          occurredAt: NOW,
          ...input,
        },
        NOW,
      ),
    );

  beforeEach(async () => {
    db = await createTestDatabase();
    const account = (name: string) =>
      unwrap(createAccount(db, { name, kind: 'card', initialBalance: '0' }, NOW));
    tbc = account('TBC');
    uzum = account('Uzum');
    cash = account('Naqd');
    expense = getCategories(db, { kind: 'expense' });
    income = getCategories(db, { kind: 'income' });
  });

  it('splits multi-category entries evenly without losing minor units', () => {
    const food = byName(expense, 'Oziq-ovqat');
    const water = byName(expense, 'Ichimlik');
    const taxi = byName(expense, 'Taksi');

    add({ categoryIds: [food.id, water.id] });
    add({ categoryIds: [taxi.id], amount: '30 000' });
    add({ categoryIds: [water.id, food.id, taxi.id], amount: '0,10' });

    const shares = getCategoryBreakdown(db, 'expense', month);
    expect(shares.map((s) => [s.name, s.amountMinor, s.count])).toEqual([
      ['Taksi', 3_000_003, 2],
      ['Ichimlik', 2_500_004, 2],
      ['Oziq-ovqat', 2_500_003, 2],
    ]);
    expect(shares.reduce((sum, s) => sum + s.amountMinor, 0)).toBe(8_000_010);
  });

  it('respects kind, period, deleted entries and keeps deleted categories', () => {
    const food = byName(expense, 'Oziq-ovqat');
    const salary = byName(income, 'Maosh');

    add({ categoryIds: [food.id] });
    add({ categoryIds: [food.id], occurredAt: new Date(2026, 7, 15).getTime() });
    unwrap(deleteTransaction(db, add({ categoryIds: [food.id], amount: '999' }).id, NOW));
    add({ type: 'income', accountId: tbc.id, categoryIds: [salary.id], amount: '2 000 000' });
    unwrap(deleteCategory(db, food.id, NOW));

    expect(getCategoryBreakdown(db, 'expense', month)).toEqual([
      { id: food.id, name: 'Oziq-ovqat', icon: 'food', amountMinor: 5_000_000, count: 1 },
    ]);
    expect(getCategoryBreakdown(db, 'income', month).map((s) => s.amountMinor)).toEqual([
      200_000_000,
    ]);
  });

  it('sums income and expenses per account without transfers', () => {
    const food = byName(expense, 'Oziq-ovqat');
    const salary = byName(income, 'Maosh');

    add({ categoryIds: [food.id] });
    add({ type: 'income', accountId: tbc.id, categoryIds: [salary.id], amount: '2 000 000' });
    add({ accountId: tbc.id, categoryIds: [food.id], amount: '10 000' });
    add({ type: 'transfer', accountId: uzum.id, toAccountId: cash.id, amount: '100 000' });

    expect(
      getAccountActivity(db, month).map((a) => [a.name, a.incomeMinor, a.expenseMinor]),
    ).toEqual([
      ['Uzum', 0, 5_000_000],
      ['TBC', 200_000_000, 1_000_000],
    ]);
  });

  it('returns monthly totals oldest first, including empty months', () => {
    const food = byName(expense, 'Oziq-ovqat');
    add({ categoryIds: [food.id] });
    add({ categoryIds: [food.id], occurredAt: new Date(2026, 6, 10).getTime() });

    const months = getMonthlyTotals(db, startOfLocalMonth(NOW), 3);
    expect(months).toEqual([
      { monthStart: new Date(2026, 6, 1).getTime(), incomeMinor: 0, expenseMinor: 5_000_000 },
      { monthStart: new Date(2026, 7, 1).getTime(), incomeMinor: 0, expenseMinor: 0 },
      { monthStart: new Date(2026, 8, 1).getTime(), incomeMinor: 0, expenseMinor: 5_000_000 },
    ]);
  });
});
