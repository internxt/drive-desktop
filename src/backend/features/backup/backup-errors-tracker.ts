import { isFatalError } from '../../../shared/issues/SyncErrorCause';
import { broadcastToWindows } from '../../../apps/main/windows';
import { BackupErrorRecord } from './backup.types';

export class BackupErrorsTracker {
  private errors: Map<number, BackupErrorRecord> = new Map();

  clear() {
    this.errors = new Map();
    this.broadcast();
  }

  add(folderId: number, error: BackupErrorRecord) {
    this.errors.set(folderId, error);
    this.broadcast();
  }

  get(folderId: number): BackupErrorRecord | undefined {
    return this.errors.get(folderId);
  }

  getAll(): BackupErrorRecord[] {
    return Array.from(this.errors.values());
  }

  lastBackupHadFatalIssue(): boolean {
    const lastError = this.getAll().at(-1);
    return lastError !== undefined && isFatalError(lastError.error);
  }

  private broadcast() {
    broadcastToWindows('backup-fatal-errors-changed', this.getAll());
  }
}
