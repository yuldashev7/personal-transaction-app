import { and, asc, eq, isNull } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { categories } from '@/database/schema';

import type { Category, CategoryKind } from './types';

export function getCategories(
  db: Database,
  { kind, includeArchived = false }: { kind?: CategoryKind; includeArchived?: boolean } = {},
): Category[] {
  return db
    .select()
    .from(categories)
    .where(
      and(
        isNull(categories.deletedAt),
        kind ? eq(categories.kind, kind) : undefined,
        includeArchived ? undefined : isNull(categories.archivedAt),
      ),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.name))
    .all();
}

/** Includes archived categories (they can be restored); excludes deleted ones. */
export function getCategoryById(db: Database, id: string): Category | undefined {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
    .get();
}
