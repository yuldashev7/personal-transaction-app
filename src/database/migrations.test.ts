import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { createAccount } from '@/features/accounts/repository';
import { getCategories } from '@/features/categories/queries';
import { createTransaction } from '@/features/transactions/repository';

import type { Database } from './client';
import migrations from './migrations/migrations';
import { categories, transactionCategories } from './schema';
import { seedDefaultCategories } from './seed';
import { createTestDatabase } from './testing/createTestDatabase';
import { TEST_NOW as NOW, unwrap } from './testing/helpers';

/** Default categories as seeded before migration 0004. */
const V1_DEFAULTS = [
  ['food', 'expense', 'Oziq-ovqat', 'food'],
  ['water', 'expense', 'Suv', 'water'],
  ['taxi', 'expense', 'Taksi', 'taxi'],
  ['metro', 'expense', 'Metro', 'metro'],
  ['shopping', 'expense', 'Xaridlar', 'shopping'],
  ['coffee', 'expense', 'Qahva', 'coffee'],
  ['pharmacy', 'expense', 'Dorixona', 'pharmacy'],
  ['home', 'expense', 'Uy', 'home'],
  ['entertainment', 'expense', 'Koʻngilochar', 'entertainment'],
  ['expense_other', 'expense', 'Boshqa', 'other'],
  ['salary', 'income', 'Maosh', 'salary'],
  ['freelance', 'income', 'Frilans', 'freelance'],
  ['gift', 'income', 'Sovgʻa', 'gift'],
  ['income_other', 'income', 'Boshqa', 'other'],
] as const;

function byKey(db: Database, systemKey: string) {
  return db.select().from(categories).where(eq(categories.systemKey, systemKey)).get();
}

describe('migration 0004 — default categories v2', () => {
  it('renames Suv, archives used and removes unused retired defaults, keeps user edits', async () => {
    const db = await createTestDatabase({ seed: false, migrationCount: 4 });
    db.insert(categories)
      .values(
        V1_DEFAULTS.map(([systemKey, kind, name, icon], index) => ({
          id: systemKey,
          systemKey,
          kind,
          name,
          icon,
          sortOrder: index,
          createdAt: 1,
          updatedAt: 1,
        })),
      )
      .run();
    // The user renamed "Uy" — it is theirs now and must not be retired.
    db.update(categories).set({ name: 'Uy-joy' }).where(eq(categories.id, 'home')).run();

    const account = unwrap(createAccount(db, { name: 'Uzum', kind: 'card', initialBalance: '' }));
    const transaction = unwrap(
      createTransaction(
        db,
        {
          type: 'expense',
          accountId: account.id,
          toAccountId: null,
          amount: '20 000',
          categoryIds: ['water', 'coffee'],
          note: '',
          occurredAt: NOW,
        },
        NOW,
      ),
    );

    await migrate(db, migrations);
    seedDefaultCategories(db);

    expect(byKey(db, 'drinks')).toMatchObject({
      id: 'water',
      name: 'Ichimlik',
      icon: 'drinks',
      archivedAt: null,
    });
    expect(byKey(db, 'coffee')).toMatchObject({ deletedAt: null });
    expect(byKey(db, 'coffee')?.archivedAt).not.toBeNull();
    expect(byKey(db, 'entertainment')?.deletedAt).not.toBeNull();
    expect(byKey(db, 'home')).toMatchObject({ name: 'Uy-joy', archivedAt: null, deletedAt: null });

    const linked = db
      .select({ categoryId: transactionCategories.categoryId })
      .from(transactionCategories)
      .where(eq(transactionCategories.transactionId, transaction.id))
      .all()
      .map((row) => row.categoryId);
    expect(linked.sort()).toEqual(['coffee', 'water']);

    expect(
      getCategories(db, { kind: 'expense' })
        .map((c) => c.name)
        .filter((name) => name !== 'Uy-joy'),
    ).toEqual([
      'Oziq-ovqat',
      'Ichimlik',
      'Taksi',
      'Avtobus',
      'Marshrutka',
      'Metro',
      'Korzinka',
      'Olma',
      'Havas',
      'Xaridlar',
      'Dorixona',
      'Kompyuter xona',
      'PlayStation',
      'Fitnes',
      'Boshqa',
    ]);
  });
});
