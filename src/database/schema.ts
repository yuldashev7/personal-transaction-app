import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import type { CurrencyCode } from '@/shared/lib/money';

export const ACCOUNT_KINDS = ['card', 'cash', 'other'] as const;
export const CATEGORY_KINDS = ['expense', 'income'] as const;
export const TRANSACTION_TYPES = ['expense', 'income', 'transfer'] as const;

const timestamps = {
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
};

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    kind: text('kind', { enum: ACCOUNT_KINDS }).notNull(),
    currencyCode: text('currency_code').$type<CurrencyCode>().notNull().default('UZS'),
    initialBalanceMinor: integer('initial_balance_minor').notNull().default(0),
    /** Digits only, display-only label (no card validation). */
    cardNumber: text('card_number'),
    color: text('color'),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('accounts_name_unique')
      .on(sql`${t.name} COLLATE NOCASE`)
      .where(sql`${t.deletedAt} IS NULL`),
    check('accounts_kind_check', sql`${t.kind} IN ('card', 'cash', 'other')`),
  ],
);

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: CATEGORY_KINDS }).notNull(),
    name: text('name').notNull(),
    icon: text('icon').notNull(),
    color: text('color'),
    /** Stable key of a built-in category; NULL for user-created ones. */
    systemKey: text('system_key').unique(),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: integer('archived_at'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('categories_kind_name_unique')
      .on(t.kind, sql`${t.name} COLLATE NOCASE`)
      .where(sql`${t.deletedAt} IS NULL`),
    check('categories_kind_check', sql`${t.kind} IN ('expense', 'income')`),
  ],
);

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: TRANSACTION_TYPES }).notNull(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    /** Destination account; set only for transfers. */
    toAccountId: text('to_account_id').references(() => accounts.id, { onDelete: 'restrict' }),
    /** Always positive; the direction comes from `type`. */
    amountMinor: integer('amount_minor').notNull(),
    note: text('note'),
    occurredAt: integer('occurred_at').notNull(),
    ...timestamps,
  },
  (t) => [
    // Matches the list order (occurred_at DESC, id DESC): no extra sort for ties, cursor seeks.
    index('transactions_occurred_id_idx')
      .on(t.occurredAt, t.id)
      .where(sql`${t.deletedAt} IS NULL`),
    index('transactions_account_idx')
      .on(t.accountId, t.occurredAt)
      .where(sql`${t.deletedAt} IS NULL`),
    index('transactions_to_account_idx')
      .on(t.toAccountId)
      .where(sql`${t.toAccountId} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    check('transactions_type_check', sql`${t.type} IN ('expense', 'income', 'transfer')`),
    check('transactions_amount_check', sql`${t.amountMinor} > 0`),
    check(
      'transactions_transfer_check',
      sql`(${t.type} = 'transfer' AND ${t.toAccountId} IS NOT NULL AND ${t.toAccountId} <> ${t.accountId})
        OR (${t.type} <> 'transfer' AND ${t.toAccountId} IS NULL)`,
    ),
  ],
);

export const transactionCategories = sqliteTable(
  'transaction_categories',
  {
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    /** Display order, e.g. "Food + Water". */
    position: integer('position').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.transactionId, t.categoryId] }),
    index('transaction_categories_category_idx').on(t.categoryId),
  ],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  /** JSON-encoded value. */
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
