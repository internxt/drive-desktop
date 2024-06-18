import { SyncError } from '../../../../shared/issues/SyncErrorCause';

export class DriveDesktopError extends Error {
  constructor(public readonly cause: SyncError, message?: string) {
    super(message);
  }
}
