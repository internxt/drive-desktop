import { ipcMain } from 'electron';
import { BackupInfo } from '../../../../backups/BackupInfo';
import { broadcastToWindows } from '../../../windows';
import { BackupsIPCMain } from '../BackupsIpc';
import { BackupCompleted, ForcedByUser } from '../BackupsStopController/BackupsStopController';
import { BackupsProgress } from '../types/BackupsProgress';
import { IndividualBackupProgress } from '../types/IndividualBackupProgress';
import { ProcessFatalErrorName } from '../BackupFatalErrors/BackupFatalErrors';
import { isSyncError } from '../../../../shared/issues/SyncErrorCause';
import { logger } from '@/apps/shared/logger/logger';

export type WorkerExitCause = ForcedByUser | BackupCompleted | ProcessFatalErrorName;

export class BackupsProcessTracker {
  private processed = 0;
  private total = 0;

  private current: IndividualBackupProgress = {
    total: 0,
    processed: 0,
  };

  private lastExistReason: WorkerExitCause | undefined;
  private exitReasons: Map<number, WorkerExitCause> = new Map();
  private abortController: AbortController | undefined;

  private notify() {
    if (this.abortController && !this.abortController.signal.aborted) {
      logger.debug({ tag: 'BACKUPS', msg: 'Progress', progress: this.progress() });
      broadcastToWindows('backup-progress', this.progress());
    }
  }

  progress(): BackupsProgress {
    return {
      currentFolder: this.currentIndex(),
      totalFolders: this.totalBackups(),
      partial: this.current,
    };
  }

  notifyLastProgress() {
    this.notify();
  }

  track(backups: Array<BackupInfo>, abortController: AbortController): void {
    this.total = backups.length;
    this.abortController = abortController;
  }

  currentTotal(total: number) {
    this.current.total = total;
  }

  currentProcessed(processed: number) {
    this.current.processed = processed;

    this.notify();
  }

  getLastExistReason() {
    return this.lastExistReason;
  }

  backing() {
    this.processed++;

    this.current = {
      total: 0,
      processed: 0,
    };

    this.notify();
  }

  currentIndex(): number {
    return this.processed;
  }

  totalBackups(): number {
    return this.total;
  }

  backupFinished(id: number, reason: WorkerExitCause) {
    this.exitReasons.set(id, reason);
    this.lastExistReason = reason;
  }

  getExitReason(id: number): WorkerExitCause | undefined {
    return this.exitReasons.get(id);
  }

  clearExistReason(id: number) {
    this.lastExistReason = undefined;
    this.exitReasons.delete(id);
  }

  reset() {
    this.processed = 0;
    this.total = 0;
    this.abortController = undefined;

    this.current = {
      total: 0,
      processed: 0,
    };
  }
}

export function initiateBackupsProcessTracker(): BackupsProcessTracker {
  const tracker = new BackupsProcessTracker();

  ipcMain.handle('get-last-backup-exit-reason', () => {
    return tracker.getLastExistReason();
  });

  void BackupsIPCMain.handle('backups.get-backup-issues', (_: unknown, id: number) => {
    const reason = tracker.getExitReason(id);

    if (reason !== undefined && isSyncError(reason)) {
      return reason;
    }

    return undefined;
  });
  BackupsIPCMain.on('backups.clear-backup-issues', (_: unknown, id: number) => {
    const reason = tracker.getExitReason(id);

    if (reason !== undefined && isSyncError(reason)) {
      tracker.clearExistReason(id);
    }
  });
  BackupsIPCMain.on('backups.get-last-progress', () => {
    // si hat un backup en progreso entonces notificar el progreso
    if (tracker.currentIndex() > 0) {
      tracker.notifyLastProgress();
    }
  });

  return tracker;
}
