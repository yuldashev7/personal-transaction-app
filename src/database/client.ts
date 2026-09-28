import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

const DATABASE_NAME = 'moneo.db';

export type Database = ExpoSQLiteDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

interface Connection {
  readonly sqlite: SQLiteDatabase;
  readonly db: Database;
}

let connection: Connection | null = null;

/** Opens the database once per app process. Throws if SQLite cannot be opened. */
export function getConnection(): Connection {
  if (connection) return connection;

  // Change listener powers live queries; foreign keys are off by default in SQLite.
  const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
  sqlite.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  connection = { sqlite, db: drizzle(sqlite, { schema }) };
  return connection;
}

export function getDatabase(): Database {
  return getConnection().db;
}
