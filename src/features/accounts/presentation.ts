import type { AppError } from '@/shared/lib/errors';
import { getErrorMessage } from '@/shared/lib/errors';
import type { IconName } from '@/shared/ui/icons';
import { resolveIconName } from '@/shared/ui/icons';

import type { Account, AccountFieldError, AccountKind } from './types';
import { normalizeCardNumber } from './validation';

export const ACCOUNT_KIND_OPTIONS: readonly {
  readonly kind: AccountKind;
  readonly label: string;
  readonly icon: IconName;
}[] = [
  { kind: 'card', label: 'Karta', icon: 'card' },
  { kind: 'cash', label: 'Naqd', icon: 'cash' },
  { kind: 'other', label: 'Boshqa', icon: 'wallet' },
];

export function getAccountKindLabel(kind: AccountKind): string {
  return ACCOUNT_KIND_OPTIONS.find((option) => option.kind === kind)?.label ?? '';
}

export function formatCardNumber(input: string): string {
  return normalizeCardNumber(input).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function getAccountIcon(account: Pick<Account, 'kind' | 'icon'>): IconName {
  if (account.icon) return resolveIconName(account.icon);
  return ACCOUNT_KIND_OPTIONS.find((option) => option.kind === account.kind)?.icon ?? 'wallet';
}

const FIELD_MESSAGES: Readonly<Record<AccountFieldError, string>> = {
  required: 'Nomini kiriting',
  too_long: 'Nom 40 belgidan oshmasin',
  duplicate: 'Bu nomli hisob allaqachon bor',
  invalid_kind: 'Turini tanlang',
  invalid: 'Summani raqamlar bilan kiriting, masalan 150 000',
  too_many_decimals: 'Kasr qismi 2 xonadan oshmasin',
  too_large: 'Summa juda katta',
};

export function getAccountFieldMessage(code: string | undefined): string | undefined {
  const messages: Readonly<Record<string, string>> = FIELD_MESSAGES;
  return code !== undefined && Object.hasOwn(messages, code) ? messages[code] : undefined;
}

export function getAccountErrorMessage(error: AppError): string {
  if (error.kind === 'constraint' && error.cause === 'account_has_transactions') {
    return 'Bu hisobda yozuvlar bor, shuning uchun uni oʻchirib boʻlmaydi. Uning oʻrniga arxivlang — tarix saqlanib qoladi.';
  }
  return getErrorMessage(error);
}
