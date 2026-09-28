import { and, eq, isNull, max, or } from 'drizzle-orm';

import type { Database } from '@/database/client';
import { mapUniqueViolation, runInDatabase } from '@/database/errors';
import { accounts, transactions } from '@/database/schema';
import { notFoundError, validationError, type AppError } from '@/shared/lib/errors';
import { createId } from '@/shared/lib/id';
import { err, ok, type Result } from '@/shared/lib/result';

import type { Account, AccountInput } from './types';
import { validateAccountInput } from './validation';

const DUPLICATE_NAME = { name: 'duplicate' } as const;

export function createAccount(
  db: Database,
  input: AccountInput,
  now: number = Date.now(),
): Result<Account, AppError> {
  const valid = validateAccountInput(input);
  if (!valid.ok) return err(validationError(valid.error));

  const result = runInDatabase(() => {
    const last = db
      .select({ value: max(accounts.sortOrder) })
      .from(accounts)
      .get();

    const account = db
      .insert(accounts)
      .values({
        id: createId(),
        ...valid.value,
        sortOrder: (last?.value ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    return ok(account);
  });

  return result.ok ? result : err(mapUniqueViolation(result.error, DUPLICATE_NAME));
}

export function updateAccount(
  db: Database,
  id: string,
  input: AccountInput,
  now: number = Date.now(),
): Result<Account, AppError> {
  const valid = validateAccountInput(input);
  if (!valid.ok) return err(validationError(valid.error));

  const result = runInDatabase(() => {
    const account = db
      .update(accounts)
      .set({ ...valid.value, updatedAt: now })
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .returning()
      .get();
    return account ? ok(account) : err(notFoundError('account', id));
  });

  return result.ok ? result : err(mapUniqueViolation(result.error, DUPLICATE_NAME));
}

/** Archived accounts are hidden from pickers and the total balance but keep their history. */
export function setAccountArchived(
  db: Database,
  id: string,
  archived: boolean,
  now: number = Date.now(),
): Result<Account, AppError> {
  return runInDatabase(() => {
    const account = db
      .update(accounts)
      .set({ archivedAt: archived ? now : null, updatedAt: now })
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .returning()
      .get();
    return account ? ok(account) : err(notFoundError('account', id));
  });
}

/**
 * Deletes an account that has never been used. Accounts referenced by any transaction
 * (including soft-deleted ones that could still be restored) must be archived instead.
 */
export function deleteAccount(
  db: Database,
  id: string,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() =>
    db.transaction((tx) => {
      const used = tx
        .select({ id: transactions.id })
        .from(transactions)
        .where(or(eq(transactions.accountId, id), eq(transactions.toAccountId, id)))
        .limit(1)
        .get();
      if (used) {
        return err<AppError>({
          kind: 'constraint',
          constraint: 'foreign_key',
          cause: 'account_has_transactions',
        });
      }

      const deleted = tx
        .update(accounts)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
        .returning({ id: accounts.id })
        .get();
      return deleted ? ok(undefined) : err(notFoundError('account', id));
    }),
  );
}
