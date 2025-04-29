import { SyncError } from '../../../../shared/issues/SyncErrorCause';

export type ProcessFatalErrorName = SyncError;

type BackupError = {
  name: string;
  error: SyncError;
};
export type BackupErrorsCollection = Array<BackupError>;

export class BackupFatalErrors {
  private errors: BackupErrorsCollection = [];

  constructor(private readonly onBackupFatalErrorsChanged: (errors: BackupErrorsCollection) => void) {}

  clear() {
    this.errors = [];
    this.onBackupFatalErrorsChanged(this.errors);
  }

  add(error: BackupError) {
    this.errors.push(error);
    this.onBackupFatalErrorsChanged(this.errors);
  }

  get(): BackupErrorsCollection {
    return this.errors;
  }
}
