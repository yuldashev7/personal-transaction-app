import { and, asc, desc, eq, gte, inArray, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { alias, type SQLiteColumn } from 'drizzle-orm/sqlite-core';

import type { Database } from '@/database/client';
import { accounts, categories, transactionCategories, transactions } from '@/database/schema';
import { parseMoney } from '@/shared/lib/money';

import type {
  Transaction,
  TransactionCategoryRef,
  TransactionCursor,
  TransactionFilter,
  TransactionListItem,
  TransactionTotals,
} from './types';

export const DEFAULT_PAGE_SIZE = 50;

const toAccounts = alias(accounts, 'to_account');

export const outerTransactionColumn = (column: SQLiteColumn) =>
  sql`${transactions}.${sql.identifier(column.name)}`;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Account and category names are matched by uncorrelated subqueries: SQLite evaluates them once
 * instead of once per transaction row (3–5× faster on large histories).
 */
function searchCondition(search: string): SQL | undefined {
  const pattern = `%${escapeLike(search)}%`;
  const matchingAccounts = sql`SELECT sa.id FROM ${accounts} AS sa
    WHERE sa.name LIKE ${pattern} ESCAPE '\\'`;
  const matches: SQL[] = [
    sql`${outerTransactionColumn(transactions.note)} LIKE ${pattern} ESCAPE '\\'`,
    sql`${outerTransactionColumn(transactions.accountId)} IN (${matchingAccounts})`,
    sql`${outerTransactionColumn(transactions.toAccountId)} IN (${matchingAccounts})`,
    sql`${outerTransactionColumn(transactions.id)} IN (SELECT stc.transaction_id
      FROM ${transactionCategories} AS stc
      JOIN ${categories} AS sc ON sc.id = stc.category_id
      WHERE sc.name LIKE ${pattern} ESCAPE '\\')`,
  ];
  const amount = parseMoney(search);
  if (amount.ok && amount.value > 0) {
    matches.push(sql`${outerTransactionColumn(transactions.amountMinor)} = ${amount.value}`);
  }
  return or(...matches);
}

/** Shared by lists, totals and statistics so they always agree on what matches. */
export function filterConditions(filter: TransactionFilter): SQL | undefined {
  const conditions: (SQL | undefined)[] = [isNull(transactions.deletedAt)];

  if (filter.range) {
    conditions.push(
      gte(transactions.occurredAt, filter.range.start),
      lt(transactions.occurredAt, filter.range.end),
    );
  }
  if (filter.type) conditions.push(eq(transactions.type, filter.type));
  if (filter.accountId) {
    conditions.push(
      or(
        eq(transactions.accountId, filter.accountId),
        eq(transactions.toAccountId, filter.accountId),
      ),
    );
  }
  if (filter.categoryIds && filter.categoryIds.length > 0) {
    conditions.push(sql`EXISTS (SELECT 1 FROM ${transactionCategories} AS ftc
      WHERE ftc.transaction_id = ${outerTransactionColumn(transactions.id)}
        AND ftc.category_id IN (${sql.join(
          filter.categoryIds.map((id) => sql`${id}`),
          sql`, `,
        )}))`);
  }
  const search = filter.search?.trim();
  if (search) conditions.push(searchCondition(search));

  return and(...conditions);
}

export function listTransactions(
  db: Database,
  {
    limit = DEFAULT_PAGE_SIZE,
    before,
    filter = {},
  }: { limit?: number; before?: TransactionCursor; filter?: TransactionFilter } = {},
): TransactionListItem[] {
  const rows = db
    .select({
      id: transactions.id,
      type: transactions.type,
      amountMinor: transactions.amountMinor,
      note: transactions.note,
      occurredAt: transactions.occurredAt,
      accountId: accounts.id,
      accountName: accounts.name,
      toAccountId: toAccounts.id,
      toAccountName: toAccounts.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(toAccounts, eq(transactions.toAccountId, toAccounts.id))
    .where(
      and(
        filterConditions(filter),
        before
          ? or(
              lt(transactions.occurredAt, before.occurredAt),
              and(eq(transactions.occurredAt, before.occurredAt), lt(transactions.id, before.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(limit)
    .all();

  const categoriesByTransaction = getCategoryRefs(
    db,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    amountMinor: row.amountMinor,
    note: row.note,
    occurredAt: row.occurredAt,
    account: { id: row.accountId, name: row.accountName },
    toAccount:
      row.toAccountId !== null && row.toAccountName !== null
        ? { id: row.toAccountId, name: row.toAccountName }
        : null,
    categories: categoriesByTransaction.get(row.id) ?? [],
  }));
}

function getCategoryRefs(
  db: Database,
  transactionIds: readonly string[],
): Map<string, TransactionCategoryRef[]> {
  const byTransaction = new Map<string, TransactionCategoryRef[]>();
  if (transactionIds.length === 0) return byTransaction;

  const rows = db
    .select({
      transactionId: transactionCategories.transactionId,
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
    })
    .from(transactionCategories)
    .innerJoin(categories, eq(transactionCategories.categoryId, categories.id))
    .where(inArray(transactionCategories.transactionId, [...transactionIds]))
    .orderBy(asc(transactionCategories.transactionId), asc(transactionCategories.position))
    .all();

  for (const { transactionId, ...category } of rows) {
    const list = byTransaction.get(transactionId);
    if (list) list.push(category);
    else byTransaction.set(transactionId, [category]);
  }
  return byTransaction;
}

export function getTransactionForEdit(
  db: Database,
  id: string,
): { transaction: Transaction; categories: TransactionCategoryRef[] } | undefined {
  const transaction = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
    .get();
  if (!transaction) return undefined;

  return { transaction, categories: getCategoryRefs(db, [id]).get(id) ?? [] };
}

export function getLastUsedAccountId(db: Database): string | undefined {
  return db
    .select({ id: accounts.id })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(isNull(transactions.deletedAt), isNull(accounts.deletedAt), isNull(accounts.archivedAt)),
    )
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(1)
    .get()?.id;
}

export function getTransactionTotals(
  db: Database,
  filter: TransactionFilter = {},
): TransactionTotals {
  const row = db
    .select({
      count: sql<number>`COUNT(*)`.mapWith(Number),
      incomeMinor: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income'
        THEN ${transactions.amountMinor} END), 0)`.mapWith(Number),
      expenseMinor: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense'
        THEN ${transactions.amountMinor} END), 0)`.mapWith(Number),
    })
    .from(transactions)
    .where(filterConditions(filter))
    .get();

  return row ?? { count: 0, incomeMinor: 0, expenseMinor: 0 };
}
