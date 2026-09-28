import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';

import type { Database, DatabaseTransaction } from '@/database/client';
import { runInDatabase } from '@/database/errors';
import { accounts, categories, transactionCategories, transactions } from '@/database/schema';
import { notFoundError, validationError, type AppError } from '@/shared/lib/errors';
import { createId } from '@/shared/lib/id';
import { err, ok, type Result } from '@/shared/lib/result';

import type {
  Transaction,
  TransactionField,
  TransactionFieldError,
  TransactionInput,
  ValidTransactionInput,
} from './types';
import { validateTransactionInput, type TransactionFieldErrors } from './validation';

interface ExistingLinks {
  readonly accountIds: ReadonlySet<string>;
  readonly categoryIds: ReadonlySet<string>;
}

const NO_EXISTING_LINKS: ExistingLinks = { accountIds: new Set(), categoryIds: new Set() };

/**
 * Verifies that referenced accounts/categories exist and fit the transaction. Archived ones — and
 * deleted categories — are rejected unless the transaction being edited already used them.
 */
function checkReferences(
  tx: DatabaseTransaction,
  input: ValidTransactionInput,
  existing: ExistingLinks,
): TransactionFieldErrors | null {
  const errors: { [K in TransactionField]?: TransactionFieldError } = {};

  const accountFields: [TransactionField, string][] = [['accountId', input.accountId]];
  if (input.type === 'transfer') accountFields.push(['toAccountId', input.toAccountId]);

  for (const [field, id] of accountFields) {
    const account = tx
      .select({ archivedAt: accounts.archivedAt })
      .from(accounts)
      .where(and(eq(accounts.id, id), isNull(accounts.deletedAt)))
      .get();
    if (!account) errors[field] = 'not_found';
    else if (account.archivedAt !== null && !existing.accountIds.has(id))
      errors[field] = 'archived';
  }

  if (input.type !== 'transfer') {
    const found = tx
      .select({
        id: categories.id,
        kind: categories.kind,
        archivedAt: categories.archivedAt,
        deletedAt: categories.deletedAt,
      })
      .from(categories)
      .where(inArray(categories.id, [...input.categoryIds]))
      .all()
      .filter((category) => category.deletedAt === null || existing.categoryIds.has(category.id));

    if (found.length !== input.categoryIds.length) {
      errors.categoryIds = 'not_found';
    } else if (found.some((category) => category.kind !== input.type)) {
      errors.categoryIds = 'kind_mismatch';
    } else if (
      found.some(
        (category) => category.archivedAt !== null && !existing.categoryIds.has(category.id),
      )
    ) {
      errors.categoryIds = 'archived';
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

function toRow(input: ValidTransactionInput) {
  return {
    type: input.type,
    accountId: input.accountId,
    toAccountId: input.type === 'transfer' ? input.toAccountId : null,
    amountMinor: input.amountMinor,
    note: input.note,
    occurredAt: input.occurredAt,
  };
}

function insertCategoryLinks(
  tx: DatabaseTransaction,
  transactionId: string,
  input: ValidTransactionInput,
) {
  if (input.type === 'transfer') return;
  tx.insert(transactionCategories)
    .values(
      input.categoryIds.map((categoryId, position) => ({ transactionId, categoryId, position })),
    )
    .run();
}

/** Saves the transaction and its categories atomically. */
export function createTransaction(
  db: Database,
  input: TransactionInput,
  now: number = Date.now(),
): Result<Transaction, AppError> {
  const valid = validateTransactionInput(input, now);
  if (!valid.ok) return err(validationError(valid.error));

  return runInDatabase(() =>
    db.transaction((tx) => {
      const referenceErrors = checkReferences(tx, valid.value, NO_EXISTING_LINKS);
      if (referenceErrors) return err(validationError(referenceErrors));

      const transaction = tx
        .insert(transactions)
        .values({ id: createId(), ...toRow(valid.value), createdAt: now, updatedAt: now })
        .returning()
        .get();
      insertCategoryLinks(tx, transaction.id, valid.value);
      return ok(transaction);
    }),
  );
}

export function updateTransaction(
  db: Database,
  id: string,
  input: TransactionInput,
  now: number = Date.now(),
): Result<Transaction, AppError> {
  const valid = validateTransactionInput(input, now);
  if (!valid.ok) return err(validationError(valid.error));

  return runInDatabase(() =>
    db.transaction((tx) => {
      const current = tx
        .select({ accountId: transactions.accountId, toAccountId: transactions.toAccountId })
        .from(transactions)
        .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
        .get();
      if (!current) return err(notFoundError('transaction', id));

      const currentCategoryIds = tx
        .select({ id: transactionCategories.categoryId })
        .from(transactionCategories)
        .where(eq(transactionCategories.transactionId, id))
        .all()
        .map((row) => row.id);

      const existing: ExistingLinks = {
        accountIds: new Set([
          current.accountId,
          ...(current.toAccountId ? [current.toAccountId] : []),
        ]),
        categoryIds: new Set(currentCategoryIds),
      };
      const referenceErrors = checkReferences(tx, valid.value, existing);
      if (referenceErrors) return err(validationError(referenceErrors));

      const transaction = tx
        .update(transactions)
        .set({ ...toRow(valid.value), updatedAt: now })
        .where(eq(transactions.id, id))
        .returning()
        .get();
      if (!transaction) return err(notFoundError('transaction', id));

      tx.delete(transactionCategories).where(eq(transactionCategories.transactionId, id)).run();
      insertCategoryLinks(tx, id, valid.value);
      return ok(transaction);
    }),
  );
}

/** Soft delete, so the action can be undone with `restoreTransaction`. */
export function deleteTransaction(
  db: Database,
  id: string,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() => {
    const deleted = db
      .update(transactions)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .returning({ id: transactions.id })
      .get();
    return deleted ? ok(undefined) : err(notFoundError('transaction', id));
  });
}

export function restoreTransaction(
  db: Database,
  id: string,
  now: number = Date.now(),
): Result<void, AppError> {
  return runInDatabase(() => {
    const restored = db
      .update(transactions)
      .set({ deletedAt: null, updatedAt: now })
      .where(and(eq(transactions.id, id), isNotNull(transactions.deletedAt)))
      .returning({ id: transactions.id })
      .get();
    return restored ? ok(undefined) : err(notFoundError('transaction', id));
  });
}
