import { sql } from 'drizzle-orm';

import { fromDatabaseError } from '../errors';
import { categories } from '../schema';
import { createTestDatabase } from './createTestDatabase';

describe('createTestDatabase', () => {
  it('applies migrations and seeds default categories', async () => {
    const db = await createTestDatabase();
    const rows = db.select().from(categories).all();
    expect(rows).toHaveLength(19);
    expect(rows.map((row) => row.name)).toContain('Oziq-ovqat');
  });

  it('enforces foreign keys, and wrapped driver errors map to AppError', async () => {
    const db = await createTestDatabase();
    let caught: unknown;
    try {
      db.run(
        sql`INSERT INTO transactions (id, type, account_id, amount_minor, occurred_at, created_at, updated_at)
            VALUES ('t', 'expense', 'missing', 100, 1, 1, 1)`,
      );
    } catch (error) {
      caught = error;
    }
    expect(fromDatabaseError(caught)).toMatchObject({
      kind: 'constraint',
      constraint: 'foreign_key',
    });
  });
});
