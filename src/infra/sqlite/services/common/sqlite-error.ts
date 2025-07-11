export type TSqliteError = 'UNKNOWN' | (string & {});
export class SqliteError extends Error {
  constructor(
    public readonly code: TSqliteError,
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}
