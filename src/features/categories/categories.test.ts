import type { Database } from '@/database/client';
import { createTestDatabase } from '@/database/testing/createTestDatabase';
import { TEST_NOW as NOW, unwrap } from '@/database/testing/helpers';

import { getCategories, getCategoryById } from './queries';
import { createCategory, deleteCategory, setCategoryArchived, updateCategory } from './repository';
import { validateCategoryInput } from './validation';

describe('validateCategoryInput', () => {
  it('accepts a valid input', () => {
    expect(validateCategoryInput({ name: ' Sport ', kind: 'expense', icon: 'sport' })).toEqual({
      ok: true,
      value: { name: 'Sport', kind: 'expense', icon: 'sport' },
    });
  });

  it('reports invalid fields', () => {
    expect(validateCategoryInput({ name: '', kind: 'expense', icon: ' ' })).toEqual({
      ok: false,
      error: { name: 'required', icon: 'required' },
    });
  });
});

describe('category repository', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createTestDatabase();
  });

  it('lists seeded defaults by kind in order', () => {
    expect(getCategories(db, { kind: 'expense' }).map((c) => c.name)).toEqual([
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
    expect(getCategories(db, { kind: 'income' }).map((c) => c.name)).toEqual([
      'Maosh',
      'Frilans',
      'Sovgʻa',
      'Boshqa',
    ]);
  });

  it('creates a category at the end of its kind', () => {
    const sport = unwrap(
      createCategory(db, { name: 'Sport', kind: 'expense', icon: 'sport' }, NOW),
    );
    expect(sport).toMatchObject({ sortOrder: 15, systemKey: null });
    expect(getCategories(db, { kind: 'expense' }).at(-1)?.id).toBe(sport.id);
  });

  it('allows the same name in different kinds but not within one kind', () => {
    expect(createCategory(db, { name: 'boshqa', kind: 'expense', icon: 'other' })).toEqual({
      ok: false,
      error: { kind: 'validation', fields: { name: 'duplicate' } },
    });
    expect(getCategories(db).filter((c) => c.name === 'Boshqa')).toHaveLength(2);
  });

  it('renames and changes icon but keeps the kind', () => {
    const [food] = getCategories(db, { kind: 'expense' });
    const updated = unwrap(updateCategory(db, food!.id, { name: 'Ovqat', icon: 'burger' }, NOW));
    expect(updated).toMatchObject({
      name: 'Ovqat',
      icon: 'burger',
      kind: 'expense',
      systemKey: 'food',
    });

    expect(updateCategory(db, food!.id, { name: 'Ichimlik', icon: 'drinks' })).toMatchObject({
      ok: false,
      error: { kind: 'validation', fields: { name: 'duplicate' } },
    });
  });

  it('archives, deletes and frees the name', () => {
    const [food, water] = getCategories(db, { kind: 'expense' });
    unwrap(setCategoryArchived(db, food!.id, true, NOW));
    expect(getCategories(db, { kind: 'expense' }).map((c) => c.id)).not.toContain(food!.id);
    expect(getCategories(db, { kind: 'expense', includeArchived: true })).toHaveLength(15);

    unwrap(deleteCategory(db, water!.id, NOW));
    expect(getCategories(db, { includeArchived: true }).map((c) => c.id)).not.toContain(water!.id);
    unwrap(createCategory(db, { name: 'Ichimlik', kind: 'expense', icon: 'drinks' }, NOW));

    expect(deleteCategory(db, water!.id)).toMatchObject({
      ok: false,
      error: { kind: 'not_found' },
    });
  });

  it('finds archived categories by id but not deleted ones', () => {
    const [food, water] = getCategories(db, { kind: 'expense' });
    unwrap(setCategoryArchived(db, food!.id, true, NOW));
    unwrap(deleteCategory(db, water!.id, NOW));

    expect(getCategoryById(db, food!.id)?.archivedAt).toBe(NOW);
    expect(getCategoryById(db, water!.id)).toBeUndefined();
    expect(getCategoryById(db, 'missing')).toBeUndefined();
  });
});
