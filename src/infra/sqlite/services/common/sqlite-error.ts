export type TSqliteError = 'UNKNOWN' | (string & { readonly brand?: unique symbol });
export class SqliteError extends Error {
  constructor(
    public readonly code: TSqliteError,
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}