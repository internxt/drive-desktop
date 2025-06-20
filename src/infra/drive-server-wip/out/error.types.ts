export type TDriveServerWipError = 'UNKNOWN' | 'NETWORK' | 'SERVER' | (string & {});

export class DriveServerWipError extends Error {
  constructor(
    public readonly code: TDriveServerWipError,
    cause: unknown,
    public readonly response?: Response,
  ) {
    super(code, { cause });
    this.name = 'DriveServerWipError';
  }
}
