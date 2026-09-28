import { CATEGORY_KINDS } from '@/database/schema';
import type { FieldErrors } from '@/shared/lib/errors';
import { err, ok, type Result } from '@/shared/lib/result';
import { validateName } from '@/shared/lib/validation';

import type { CategoryField, CategoryFieldError, CategoryInput, ValidCategoryInput } from './types';

const ICON_KEY_MAX_LENGTH = 40;

export function validateCategoryInput(
  input: CategoryInput,
): Result<ValidCategoryInput, FieldErrors<CategoryField, CategoryFieldError>> {
  const errors: { [K in CategoryField]?: CategoryFieldError } = {};

  const name = validateName(input.name);
  if (!name.ok) errors.name = name.error;

  if (!CATEGORY_KINDS.includes(input.kind)) errors.kind = 'invalid_kind';

  const icon = input.icon.trim();
  if (icon === '') errors.icon = 'required';
  else if (icon.length > ICON_KEY_MAX_LENGTH) errors.icon = 'too_long';

  if (!name.ok || Object.keys(errors).length > 0) return err(errors);
  return ok({ name: name.value, kind: input.kind, icon });
}
