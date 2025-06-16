export type TDriveServerWipError = 'UNKNOWN' | 'NETWORK' | 'SERVER' | (string & {});

export class DriveServerWipError extends Error {
  constructor(
    public readonly code: TDriveServerWipError,
    public readonly response?: Response,
  ) {
    super(code);
    this.name = 'DriveServerWipError';
  }
}
