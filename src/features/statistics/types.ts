import type { AccountKind } from '@/features/accounts/types';
import type { CategorizedTransactionType } from '@/features/transactions/types';

export type BreakdownKind = CategorizedTransactionType;

export interface CategoryShare {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  /** Multi-category entries are split evenly, so shares add up to the period total. */
  readonly amountMinor: number;
  readonly count: number;
}

export interface AccountActivity {
  readonly id: string;
  readonly name: string;
  readonly kind: AccountKind;
  readonly icon: string | null;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
}

export interface MonthTotals {
  readonly monthStart: number;
  readonly incomeMinor: number;
  readonly expenseMinor: number;
}
