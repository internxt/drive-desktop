export type TDriveServerWipError = 'UNKNOWN' | 'NETWORK' | 'SERVER' | 'ABORTED' | (string & { readonly brand?: unique symbol });

export class DriveServerWipError extends Error {
  constructor(
    public readonly code: TDriveServerWipError,
    cause: unknown,
    public readonly response?: Response,
  ) {
    super(code, { cause });
  }
}
