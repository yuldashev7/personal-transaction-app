import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { backupDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { AppError } from '@/shared/lib/errors';
import { logger } from '@/shared/lib/logger';
import { err, ok, type Result } from '@/shared/lib/result';

import { getConnection } from './client';
import { fromDatabaseError } from './errors';
import migrations from './migrations/migrations';
import { seedDefaultCategories } from './seed';

const PRE_MIGRATION_BACKUP_NAME = 'moneo-pre-migration-backup.db';

const MIGRATIONS_TABLE = '__drizzle_migrations';

interface MigrationStatus {
  readonly hasExistingData: boolean;
  readonly hasPending: boolean;
}

function getMigrationStatus(sqlite: SQLiteDatabase): MigrationStatus {
  const table = sqlite.getFirstSync<Record<string, unknown>>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    MIGRATIONS_TABLE,
  );
  if (!table) return { hasExistingData: false, hasPending: true };

  const row = sqlite.getFirstSync<Record<string, unknown>>(
    `SELECT MAX(created_at) AS last_applied FROM ${MIGRATIONS_TABLE}`,
  );
  const lastApplied = Number(row?.last_applied ?? 0);
  const latest = migrations.journal.entries.at(-1)?.when ?? 0;

  return { hasExistingData: lastApplied > 0, hasPending: latest > lastApplied };
}

async function backupBeforeMigration(sqlite: SQLiteDatabase): Promise<void> {
  const backup = await openDatabaseAsync(PRE_MIGRATION_BACKUP_NAME);
  try {
    await backupDatabaseAsync({ sourceDatabase: sqlite, destDatabase: backup });
  } finally {
    await backup.closeAsync();
  }
}

/**
 * Opens the database, applies pending migrations and seeds defaults.
 * An existing database is backed up first; if the backup fails, migration is not attempted.
 */
export async function initializeDatabase(): Promise<Result<void, AppError>> {
  const startedAt = Date.now();
  try {
    const { sqlite, db } = getConnection();
    const status = getMigrationStatus(sqlite);

    if (status.hasPending) {
      if (status.hasExistingData) {
        await backupBeforeMigration(sqlite);
      }
      await migrate(db, migrations);
    }

    seedDefaultCategories(db);

    if (__DEV__) {
      const counts = sqlite.getFirstSync<Record<string, unknown>>(
        `SELECT (SELECT COUNT(*) FROM categories) AS categories,
                (SELECT COUNT(*) FROM ${MIGRATIONS_TABLE}) AS migrations`,
      );
      logger.debug('Database ready', {
        ...counts,
        backedUp: status.hasPending && status.hasExistingData,
        durationMs: Date.now() - startedAt,
      });
    }
    return ok(undefined);
  } catch (error) {
    logger.error('Database initialization failed', error);
    return err(fromDatabaseError(error));
  }
}
