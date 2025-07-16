import { SqliteError, TSqliteError } from './sqlite-error';

export class SingleItemError extends SqliteError {
  constructor(
    public readonly code: TSqliteError | 'NOT_FOUND',
    cause?: unknown,
  ) {
    super(code, cause);
  }
}
