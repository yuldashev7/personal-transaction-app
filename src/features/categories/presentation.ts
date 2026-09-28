import { CATEGORY_KINDS } from '@/database/schema';
import type { IconName } from '@/shared/ui/icons';

import type { CategoryField, CategoryFieldError, CategoryKind } from './types';

export const CATEGORY_KIND_OPTIONS: readonly {
  readonly kind: CategoryKind;
  readonly label: string;
}[] = [
  { kind: 'expense', label: 'Xarajat' },
  { kind: 'income', label: 'Daromad' },
];

export function parseCategoryKind(value: unknown): CategoryKind {
  return CATEGORY_KINDS.find((kind) => kind === value) ?? 'expense';
}

export function getCategoryKindLabel(kind: CategoryKind): string {
  return CATEGORY_KIND_OPTIONS.find((option) => option.kind === kind)?.label ?? '';
}

/** Icons offered when creating or editing a category; labels are read by screen readers. */
export const CATEGORY_ICON_OPTIONS: readonly { readonly icon: IconName; readonly label: string }[] =
  [
    { icon: 'food', label: 'Ovqat' },
    { icon: 'drinks', label: 'Ichimlik' },
    { icon: 'coffee', label: 'Qahva' },
    { icon: 'supermarket', label: 'Supermarket' },
    { icon: 'shopping', label: 'Xarid' },
    { icon: 'water', label: 'Suv' },
    { icon: 'taxi', label: 'Taksi' },
    { icon: 'bus', label: 'Avtobus' },
    { icon: 'minibus', label: 'Marshrutka' },
    { icon: 'metro', label: 'Metro' },
    { icon: 'fuel', label: 'Yoqilgʻi' },
    { icon: 'home', label: 'Uy' },
    { icon: 'rent', label: 'Ijara' },
    { icon: 'utilities', label: 'Kommunal' },
    { icon: 'phone', label: 'Telefon' },
    { icon: 'internet', label: 'Internet' },
    { icon: 'pharmacy', label: 'Dorixona' },
    { icon: 'health', label: 'Salomatlik' },
    { icon: 'beauty', label: 'Goʻzallik' },
    { icon: 'clothes', label: 'Kiyim' },
    { icon: 'sport', label: 'Sport' },
    { icon: 'fitness', label: 'Fitnes' },
    { icon: 'education', label: 'Taʼlim' },
    { icon: 'entertainment', label: 'Oʻyinlar' },
    { icon: 'computer', label: 'Kompyuter' },
    { icon: 'travel', label: 'Sayohat' },
    { icon: 'kids', label: 'Bolalar' },
    { icon: 'pets', label: 'Uy hayvonlari' },
    { icon: 'repair', label: 'Taʼmir' },
    { icon: 'gift', label: 'Sovgʻa' },
    { icon: 'salary', label: 'Maosh' },
    { icon: 'freelance', label: 'Frilans' },
    { icon: 'interest', label: 'Foiz' },
    { icon: 'other', label: 'Boshqa' },
  ];

const NAME_MESSAGES: Readonly<Record<string, string>> = {
  required: 'Nomini kiriting',
  too_long: 'Nom 40 belgidan oshmasin',
  duplicate: 'Bu nomli kategoriya allaqachon bor',
} satisfies Partial<Record<CategoryFieldError, string>>;

const FIELD_MESSAGES: Readonly<Record<CategoryField, Readonly<Record<string, string>>>> = {
  name: NAME_MESSAGES,
  icon: { required: 'Belgini tanlang', too_long: 'Belgini qaytadan tanlang' },
  kind: { invalid_kind: 'Turini tanlang' },
};

/** Repository validation errors arrive untyped (`FieldErrors<string>`), hence the lookup guard. */
export function getCategoryFieldMessage(
  field: CategoryField,
  code: string | undefined,
): string | undefined {
  const messages = FIELD_MESSAGES[field];
  return code !== undefined && Object.hasOwn(messages, code) ? messages[code] : undefined;
}
