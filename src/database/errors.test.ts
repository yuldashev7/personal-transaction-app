import { fromDatabaseError } from './errors';

describe('fromDatabaseError', () => {
  it.each([
    ['UNIQUE constraint failed: accounts.name', 'unique'],
    ['FOREIGN KEY constraint failed', 'foreign_key'],
    ['CHECK constraint failed: transactions_amount_check', 'check'],
    ['NOT NULL constraint failed: accounts.name', 'not_null'],
  ])('maps %j to a %s constraint error', (message, constraint) => {
    const error = new Error(message);
    expect(fromDatabaseError(error)).toEqual({ kind: 'constraint', constraint, cause: error });
  });

  it('finds the constraint inside a wrapped error cause', () => {
    const driverError = new Error('Error code 19: UNIQUE constraint failed: categories.name');
    const wrapped = new Error('Failed query: insert into "categories" ...', { cause: driverError });
    expect(fromDatabaseError(wrapped)).toMatchObject({ kind: 'constraint', constraint: 'unique' });
  });

  it('falls back to a generic database error', () => {
    const error = new Error('database is locked');
    expect(fromDatabaseError(error)).toEqual({ kind: 'database', cause: error });
    expect(fromDatabaseError('boom')).toEqual({ kind: 'database', cause: 'boom' });
  });
});
