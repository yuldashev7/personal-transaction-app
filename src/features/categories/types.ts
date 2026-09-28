import type { categories } from '@/database/schema';
import type { NameError } from '@/shared/lib/validation';

export type Category = typeof categories.$inferSelect;
export type CategoryKind = Category['kind'];

export interface CategoryInput {
  readonly name: string;
  readonly kind: CategoryKind;
  readonly icon: string;
}

/** A category's kind is fixed after creation: existing transactions depend on it. */
export type CategoryUpdateInput = Omit<CategoryInput, 'kind'>;

export interface ValidCategoryInput {
  readonly name: string;
  readonly kind: CategoryKind;
  readonly icon: string;
}

export type CategoryField = keyof CategoryInput;

export type CategoryFieldError = NameError | 'duplicate' | 'invalid_kind';
