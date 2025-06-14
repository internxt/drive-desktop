import { FetchError } from '../in/helpers/error-helpers';

export type TDriveServerWipError = 'UNKNOWN' | 'NETWORK' | 'SERVER' | (string & {});

export class DriveServerWipError extends Error {
  constructor(
    public readonly code: TDriveServerWipError,
    cause: unknown,
    public readonly fetchError?: FetchError,
  ) {
    super(code);
    this.name = 'DriveServerWipError';
    this.cause = cause;
  }
}
