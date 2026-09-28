import type { accounts } from '@/database/schema';
import type { MoneyParseError } from '@/shared/lib/money';
import type { NameError } from '@/shared/lib/validation';

export type Account = typeof accounts.$inferSelect;
export type AccountKind = Account['kind'];

export interface AccountWithBalance extends Account {
  readonly balanceMinor: number;
}

/** Raw form values. An empty `initialBalance` means zero; `cardNumber` is optional free input. */
export interface AccountInput {
  readonly name: string;
  readonly kind: AccountKind;
  readonly initialBalance: string;
  readonly cardNumber?: string;
}

export interface ValidAccountInput {
  readonly name: string;
  readonly kind: AccountKind;
  readonly initialBalanceMinor: number;
  readonly cardNumber: string | null;
}

export type AccountField = Exclude<keyof AccountInput, 'cardNumber'>;

export type AccountFieldError =
  NameError | 'duplicate' | 'invalid_kind' | Exclude<MoneyParseError, 'empty'>;
