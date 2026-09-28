export type FieldErrors<Field extends string = string, Code extends string = string> = Readonly<
  Partial<Record<Field, Code>>
>;

export type ConstraintKind = 'unique' | 'foreign_key' | 'check' | 'not_null';

export type AppError =
  | { readonly kind: 'validation'; readonly fields: FieldErrors }
  | { readonly kind: 'not_found'; readonly entity: string; readonly id: string }
  | { readonly kind: 'constraint'; readonly constraint: ConstraintKind; readonly cause: unknown }
  | { readonly kind: 'database'; readonly cause: unknown }
  | { readonly kind: 'unexpected'; readonly cause: unknown };

export type AppErrorKind = AppError['kind'];

export function validationError(fields: FieldErrors): AppError {
  return { kind: 'validation', fields };
}

export function notFoundError(entity: string, id: string): AppError {
  return { kind: 'not_found', entity, id };
}

export function unexpectedError(cause: unknown): AppError {
  return { kind: 'unexpected', cause };
}

/**
 * Safe, non-technical message for errors that are not shown next to a form field.
 * Features handle their own expected cases (validation, specific constraints) before falling back.
 */
export function getErrorMessage(error: AppError): string {
  return error.kind === 'not_found'
    ? 'Maʼlumot topilmadi — u oʻchirilgan boʻlishi mumkin.'
    : 'Amalni bajarib boʻlmadi. Qaytadan urinib koʻring.';
}
