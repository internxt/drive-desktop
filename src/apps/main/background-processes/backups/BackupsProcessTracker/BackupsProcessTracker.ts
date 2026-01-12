import { logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastToWindows } from '../../../windows';
import { BackupCompleted, ForcedByUser } from '../BackupsStopController/BackupsStopController';
import { BackupsProgress } from '../types/BackupsProgress';
import { IndividualBackupProgress } from '../types/IndividualBackupProgress';
import { ProcessFatalErrorName } from '../BackupFatalErrors/BackupFatalErrors';
export type WorkerExitCause = ForcedByUser | BackupCompleted | ProcessFatalErrorName;

export class BackupsProcessTracker {
  private processed = 0;
  private total = 0;

  private current: IndividualBackupProgress = {
    total: 0,
    processed: 0,
  };

  private lastExitReason: WorkerExitCause | undefined;
  public exitReasons: Map<number, WorkerExitCause> = new Map();

  progress(): BackupsProgress {
    return {
      currentFolder: this.processed,
      totalFolders: this.total,
      partial: this.current,
    };
  }

  track(totalBackups: number): void {
    this.total = totalBackups;
  }

  public getCurrentProcessed(): number {
    return this.current.processed;
  }

  public updateCurrentProcessed(newProcessedCount: number): void {
    this.current.processed = newProcessedCount;
    this.updateProgress(this.progress());
  }

  public initializeCurrentBackup(total: number, processed: number): void {
    this.current.total = total;
    this.current.processed = processed;
    this.updateProgress(this.progress());
  }

  getLastExitReason() {
    return this.lastExitReason;
  }

  backing() {
    this.processed++;

    this.current = {
      total: 0,
      processed: 0,
    };

    this.updateProgress(this.progress());
  }

  backupFinished(id: number, reason: WorkerExitCause) {
    this.exitReasons.set(id, reason);
    this.lastExitReason = reason;
  }

  reset() {
    this.processed = 0;
    this.total = 0;

    this.current = {
      total: 0,
      processed: 0,
    };
  }

  updateProgress(progress: BackupsProgress) {
    logger.debug({ tag: 'BACKUPS', msg: 'Progress update', progress });
    /**
     * TODO: Emit a percentage progress so that we move the whole calculation to the backend
     * instead of the useBackupProgress.calculatePercentualProgress() in the renderer.
     */
    broadcastToWindows('backup-progress', progress);
  }
  getExitReason(id: number): WorkerExitCause | undefined {
    return this.exitReasons.get(id);
  }
}
