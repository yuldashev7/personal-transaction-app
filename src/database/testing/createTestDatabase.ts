import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';

import type { Database } from '../client';
import migrations from '../migrations/migrations';
import * as schema from '../schema';
import { seedDefaultCategories } from '../seed';

type Params = readonly SQLInputValue[];

function executeSync(statement: StatementSync, params: Params) {
  if (statement.columns().length === 0) {
    const result = statement.run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
      getAllSync: () => [],
      getFirstSync: () => null,
    };
  }
  const rows = statement.all(...params);
  return {
    changes: 0,
    lastInsertRowId: 0,
    getAllSync: () => rows,
    getFirstSync: () => rows[0] ?? null,
  };
}

/**
 * Implements the part of expo-sqlite's API that Drizzle's expo driver uses
 * (`prepareSync` → `executeSync` / `executeForRawResultSync`) on top of Node's built-in SQLite.
 */
function createNodeClient(native: DatabaseSync) {
  return {
    prepareSync(sql: string) {
      const statement = native.prepare(sql);
      return {
        executeSync: (params: Params) => {
          statement.setReturnArrays(false);
          return executeSync(statement, params);
        },
        executeForRawResultSync: (params: Params) => {
          statement.setReturnArrays(true);
          return executeSync(statement, params);
        },
      };
    },
  };
}

/**
 * In-memory database with production migrations applied, for repository/query tests.
 * `migrationCount` applies only the first N migrations (upgrade tests call `migrate` again later).
 */
export async function createTestDatabase(
  options: { seed?: boolean; migrationCount?: number } = {},
): Promise<Database> {
  const native = new DatabaseSync(':memory:');
  native.exec('PRAGMA foreign_keys = ON;');

  // The client only covers what Drizzle calls; the rest of SQLiteDatabase is never touched.
  const client = createNodeClient(native) as unknown as SQLiteDatabase;
  const db = drizzle(client, { schema });

  const count = options.migrationCount;
  await migrate(
    db,
    count === undefined
      ? migrations
      : {
          ...migrations,
          journal: { ...migrations.journal, entries: migrations.journal.entries.slice(0, count) },
        },
  );
  if (options.seed ?? true) seedDefaultCategories(db, 1);
  return db;
}
