import type { transactions } from '@/database/schema';
import type { DateRange } from '@/shared/lib/date';
import type { MoneyParseError } from '@/shared/lib/money';

export type Transaction = typeof transactions.$inferSelect;
export type TransactionType = Transaction['type'];
export type CategorizedTransactionType = Exclude<TransactionType, 'transfer'>;

/** Raw form values. Expense/income need categories; transfers need a destination account. */
export interface TransactionInput {
  readonly type: TransactionType;
  readonly accountId: string | null;
  readonly toAccountId: string | null;
  readonly amount: string;
  readonly categoryIds: readonly string[];
  readonly note: string;
  readonly occurredAt: number;
}

interface ValidTransactionBase {
  readonly accountId: string;
  readonly amountMinor: number;
  readonly note: string | null;
  readonly occurredAt: number;
}

export type ValidTransactionInput =
  | (ValidTransactionBase & {
      readonly type: CategorizedTransactionType;
      readonly categoryIds: readonly string[];
    })
  | (ValidTransactionBase & { readonly type: 'transfer'; readonly toAccountId: string });

export type TransactionField = keyof TransactionInput;

export type TransactionFieldError =
  | 'required'
  | 'invalid_type'
  | Exclude<MoneyParseError, 'empty'>
  | 'not_positive'
  | 'same_account'
  | 'not_found'
  | 'archived'
  | 'kind_mismatch'
  | 'too_long'
  | 'in_future';

export interface TransactionCategoryRef {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

export interface TransactionListItem {
  readonly id: string;
  readonly type: TransactionType;
  readonly amountMinor: number;
  readonly note: string | null;
  readonly occurredAt: number;
  readonly account: { readonly id: string; readonly name: string };
  readonly toAccount: { readonly id: string; readonly name: string } | null;
  /** In display order, e.g. "Oziq-ovqat + Suv". Empty for transfers. */
  readonly categories: readonly TransactionCategoryRef[];
}

/** Keyset pagination position: the last item of the previous page. */
export interface TransactionCursor {
  readonly occurredAt: number;
  readonly id: string;
}

/** Transfers are counted but not summed: they move money between own accounts. */
export interface TransactionTotals {
  readonly count: number;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
}

/** All criteria are combined with AND; empty ones are ignored. */
export interface TransactionFilter {
  /** Matches note, account or category name (case-insensitive for Latin letters), or the exact amount. */
  readonly search?: string;
  readonly type?: TransactionType;
  /** Source or destination account. */
  readonly accountId?: string;
  /** Any of these categories. */
  readonly categoryIds?: readonly string[];
  readonly range?: DateRange;
}
