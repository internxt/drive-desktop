export type TDriveServerWipError = 'UNKNOWN' | 'NETWORK' | 'SERVER' | (string & {});

export class DriveServerWipError extends Error {
  constructor(
    public readonly code: TDriveServerWipError,
    cause: unknown,
  ) {
    super(code);
    this.name = 'DriveServerWipError';
    this.cause = cause;
  }
}
