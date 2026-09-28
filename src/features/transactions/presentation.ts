import { TRANSACTION_TYPES } from '@/database/schema';
import { formatDayLabel, startOfLocalDay } from '@/shared/lib/date';
import { resolveIconName, type IconName } from '@/shared/ui/icons';

import type {
  TransactionField,
  TransactionFieldError,
  TransactionListItem,
  TransactionType,
} from './types';

export const TRANSACTION_TYPE_OPTIONS: readonly {
  readonly type: TransactionType;
  readonly label: string;
  readonly icon: IconName;
}[] = [
  { type: 'expense', label: 'Xarajat', icon: 'expense' },
  { type: 'income', label: 'Daromad', icon: 'income' },
  { type: 'transfer', label: 'Oʻtkazma', icon: 'transfer' },
];

export function parseTransactionType(value: unknown): TransactionType {
  return TRANSACTION_TYPES.find((type) => type === value) ?? 'expense';
}

const SAVED_MESSAGES: Readonly<Record<TransactionType, string>> = {
  expense: 'Xarajat saqlandi',
  income: 'Daromad saqlandi',
  transfer: 'Oʻtkazma saqlandi',
};

export function getTransactionSavedMessage(type: TransactionType): string {
  return SAVED_MESSAGES[type];
}

/** "Oziq-ovqat + Suv" for expense/income, "TBC → Naqd" for transfers. */
export function getTransactionTitle(item: TransactionListItem): string {
  if (item.type === 'transfer') {
    return `${item.account.name} → ${item.toAccount?.name ?? '—'}`;
  }
  return item.categories.map((category) => category.name).join(' + ') || 'Kategoriyasiz';
}

/** "Bugun · Uzum · tushlik"; transfers already name their accounts in the title. */
export function getTransactionSubtitle(item: TransactionListItem, now: number): string {
  const parts = [formatDayLabel(item.occurredAt, now)];
  if (item.type !== 'transfer') parts.push(item.account.name);
  if (item.note) parts.push(item.note);
  return parts.join(' · ');
}

export function getTransactionIcon(item: TransactionListItem): IconName {
  return item.type === 'transfer' ? 'transfer' : resolveIconName(item.categories[0]?.icon);
}

export function getTransactionTone(type: TransactionType): 'income' | 'expense' | 'neutral' {
  return type === 'transfer' ? 'neutral' : type;
}

export type TransactionListEntry =
  | { readonly kind: 'day'; readonly key: string; readonly label: string }
  | { readonly kind: 'transaction'; readonly key: string; readonly item: TransactionListItem };

/** Inserts a day header before each local day. Expects items newest first, as listed. */
export function groupTransactionsByDay(
  items: readonly TransactionListItem[],
  now: number,
): TransactionListEntry[] {
  const entries: TransactionListEntry[] = [];
  let currentDay: number | null = null;
  for (const item of items) {
    const day = startOfLocalDay(new Date(item.occurredAt)).getTime();
    if (day !== currentDay) {
      currentDay = day;
      entries.push({ kind: 'day', key: `day-${day}`, label: formatDayLabel(day, now) });
    }
    entries.push({ kind: 'transaction', key: item.id, item });
  }
  return entries;
}

type Messages = Readonly<Partial<Record<TransactionFieldError, string>>>;

const ACCOUNT_MESSAGES: Messages = {
  required: 'Hisobni tanlang',
  not_found: 'Bu hisob oʻchirilgan — boshqasini tanlang',
  archived: 'Bu hisob arxivlangan — boshqasini tanlang',
};

const FIELD_MESSAGES: Readonly<Record<TransactionField, Messages>> = {
  type: { invalid_type: 'Turini tanlang' },
  amount: {
    required: 'Summani kiriting',
    invalid: 'Summani raqamlar bilan kiriting, masalan 50 000',
    too_many_decimals: 'Kasr qismi 2 xonadan oshmasin',
    too_large: 'Summa juda katta',
    not_positive: 'Summa 0 dan katta boʻlsin',
  },
  accountId: ACCOUNT_MESSAGES,
  toAccountId: {
    ...ACCOUNT_MESSAGES,
    required: 'Qaysi hisobga oʻtkazilishini tanlang',
    same_account: 'Boshqa hisobni tanlang',
  },
  categoryIds: {
    required: 'Kamida bitta kategoriya tanlang',
    not_found: 'Tanlangan kategoriya oʻchirilgan — qaytadan tanlang',
    archived: 'Tanlangan kategoriya arxivlangan — boshqasini tanlang',
    kind_mismatch: 'Kategoriyalarni qaytadan tanlang',
  },
  note: { too_long: 'Izoh 200 belgidan oshmasin' },
  occurredAt: {
    invalid: 'Sanani qaytadan tanlang',
    in_future: 'Kelajakdagi sanani tanlab boʻlmaydi',
  },
};

/** Repository validation errors arrive untyped (`FieldErrors<string>`), hence the lookup guard. */
export function getTransactionFieldMessage(
  field: TransactionField,
  code: string | undefined,
): string | undefined {
  const messages: Readonly<Record<string, string | undefined>> = FIELD_MESSAGES[field];
  return code !== undefined && Object.hasOwn(messages, code) ? messages[code] : undefined;
}
