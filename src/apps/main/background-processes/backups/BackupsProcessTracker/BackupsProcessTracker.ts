import { ipcMain } from 'electron';
import Logger from 'electron-log';
import { BackupInfo } from '../../../../backups/BackupInfo';
import { broadcastToWindows } from '../../../windows';
import { BackupsIPCMain } from '../BackupsIpc';
import {
  BackupCompleted,
  ForcedByUser,
} from '../BackupsStopController/BackupsStopController';
import { BackupsProgress } from '../types/BackupsProgress';
import { IndividualBackupProgress } from '../types/IndividualBackupProgress';
import { ProcessFatalErrorName } from '../BackupFatalErrors/BackupFatalErrors';
import { isSyncError } from '../../../../../shared/issues/SyncErrorCause';

export type WorkerExitCause =
  | ForcedByUser
  | BackupCompleted
  | ProcessFatalErrorName;

export class BackupsProcessTracker {
  private processed = 0;
  private total = 0;

  private current: IndividualBackupProgress = {
    total: 0,
    processed: 0,
  };

  private lastExistReason: WorkerExitCause | undefined;
  public exitReasons: Map<number, WorkerExitCause> = new Map();

  constructor(private readonly notify: (progress: BackupsProgress) => void) {}

  progress(): BackupsProgress {
    return {
      currentFolder: this.currentIndex(),
      totalFolders: this.totalBackups(),
      partial: this.current,
    };
  }

  track(backups: Array<BackupInfo>): void {
    this.total = backups.length;
  }

  currentTotal(total: number) {
    this.current.total = total;
  }

  currentProcessed(processed: number) {
    this.current.processed = processed;

    this.notify(this.progress());
  }

  getLastExistReason() {
    return this.lastExistReason;
  }

  backing(_: BackupInfo) {
    this.processed++;

    this.current = {
      total: 0,
      processed: 0,
    };

    this.notify(this.progress());
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

  getExistReason(id: number): WorkerExitCause | undefined {
    Logger.debug(this.exitReasons.keys(), id);
    return this.exitReasons.get(id);
  }

  reset() {
    this.processed = 0;
    this.total = 0;

    this.current = {
      total: 0,
      processed: 0,
    };
  }
}

export function initiateBackupsProcessTracker(): BackupsProcessTracker {
  const notifyUI = (progress: BackupsProgress) => {
    Logger.debug('Progress', progress);
    broadcastToWindows('backup-progress', progress);
  };

  const tracker = new BackupsProcessTracker(notifyUI);

  ipcMain.handle('get-last-backup-exit-reason', () => {
    return tracker.getLastExistReason();
  });

  BackupsIPCMain.handle('backups.get-backup-issues', (_, id: number) => {
    const reason = tracker.getExistReason(id);

    if (reason !== undefined && isSyncError(reason)) {
      return reason;
    }

    return undefined;
  });

  BackupsIPCMain.on(
    'backups.total-items-calculated',
    (_, total: number, processed: number) => {
      tracker.currentTotal(total);
      tracker.currentProcessed(processed);
    }
  );

  BackupsIPCMain.on('backups.progress-update', (_, processed: number) => {
    tracker.currentProcessed(processed);
  });

  return tracker;
}
