import {
  validationError,
  type AppError,
  type ConstraintKind,
  type FieldErrors,
} from '@/shared/lib/errors';
import { logger } from '@/shared/lib/logger';
import { err, type Result } from '@/shared/lib/result';

const CONSTRAINT_PATTERNS: readonly (readonly [RegExp, ConstraintKind])[] = [
  [/UNIQUE constraint failed/i, 'unique'],
  [/FOREIGN KEY constraint failed/i, 'foreign_key'],
  [/CHECK constraint failed/i, 'check'],
  [/NOT NULL constraint failed/i, 'not_null'],
];

const MAX_CAUSE_DEPTH = 5;

/** Drizzle wraps driver errors ("Failed query: ..."), so the whole `cause` chain is inspected. */
function collectMessages(error: unknown): string[] {
  const messages: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current !== undefined; depth++) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = current.cause;
    } else {
      messages.push(String(current));
      break;
    }
  }
  return messages;
}

export function fromDatabaseError(error: unknown): AppError {
  const messages = collectMessages(error);

  for (const [pattern, constraint] of CONSTRAINT_PATTERNS) {
    if (messages.some((message) => pattern.test(message))) {
      return { kind: 'constraint', constraint, cause: error };
    }
  }
  return { kind: 'database', cause: error };
}

/** Runs a database operation; any thrown error becomes an `AppError` instead of crashing the app. */
export function runInDatabase<T>(operation: () => Result<T, AppError>): Result<T, AppError> {
  try {
    return operation();
  } catch (error) {
    const appError = fromDatabaseError(error);
    if (appError.kind === 'constraint') {
      logger.debug(`Database constraint violated: ${appError.constraint}`, error);
    } else {
      logger.error('Database operation failed', error);
    }
    return err(appError);
  }
}

/** Turns a UNIQUE violation into field errors (e.g. `{ name: 'duplicate' }`) the form can show. */
export function mapUniqueViolation(error: AppError, fields: FieldErrors): AppError {
  return error.kind === 'constraint' && error.constraint === 'unique'
    ? validationError(fields)
    : error;
}
