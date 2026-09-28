import { and, eq, isNull, max } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { mapUniqueViolation, runInDatabase } from '@/database/errors';
import { categories } from '@/database/schema';
import { notFoundError, validationError, type AppError } from '@/shared/lib/errors';
import { createId } from '@/shared/lib/id';
import { err, ok, type Result } from '@/shared/lib/result';

import type { Category, CategoryInput, CategoryUpdateInput } from './types';
import { validateCategoryInput } from './validation';

const DUPLICATE_NAME = { name: 'duplicate' } as const;

export function createCategory(
  db: Database,
  input: CategoryInput,
  now: number = Date.now(),
): Result<Category, AppError> {
  const valid = validateCategoryInput(input);
  if (!valid.ok) return err(validationError(valid.error));

  const result = runInDatabase(() => {
    const last = db
      .select({ value: max(categories.sortOrder) })
      .from(categories)
      .where(eq(categories.kind, valid.value.kind))
      .get();

    const category = db
      .insert(categories)
      .values({
        id: createId(),
        ...valid.value,
        sortOrder: (last?.value ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    return ok(category);
  });

  return result.ok ? result : err(mapUniqueViolation(result.error, DUPLICATE_NAME));
}

export function updateCategory(
  db: Database,
  id: string,
  input: CategoryUpdateInput,
  now: number = Date.now(),
): Result<Category, AppError> {
  const result = runInDatabase(() => {
    const existing = db
      .select({ kind: categories.kind })
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .get();
    if (!existing) return err(notFoundError('category', id));

    const valid = validateCategoryInput({ ...input, kind: existing.kind });
    if (!valid.ok) return err(validationError(valid.error));

    const category = db
      .update(categories)
      .set({ name: valid.value.name, icon: valid.value.icon, updatedAt: now })
      .where(eq(categories.id, id))
      .returning()
      .get();
    return category ? ok(category) : err(notFoundError('category', id));
  });

  return result.ok ? result : err(mapUniqueViolation(result.error, DUPLICATE_NAME));
}

/** Archived categories disappear from pickers but stay on past transactions. */
export function setCategoryArchived(
  db: Database,
  id: string,
  archived: boolean,
  now: number = Date.now(),
): Result<Category, AppError> {
  return runInDatabase(() => {
    const category = db
      .update(categories)
      .set({ archivedAt: archived ? now : null, updatedAt: now })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning()
      .get();
    return category ? ok(category) : err(notFoundError('category', id));
  });
}

/**
 * Soft delete: past transactions keep showing the category name, and the name becomes
 * available again for a new category.
 */
export function deleteCategory(
  db: Database,
  id: string,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() => {
    const deleted = db
      .update(categories)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning({ id: categories.id })
      .get();
    return deleted ? ok(undefined) : err(notFoundError('category', id));
  });
}
