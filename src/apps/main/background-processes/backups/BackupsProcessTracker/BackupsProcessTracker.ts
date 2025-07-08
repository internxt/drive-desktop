import { BackupInfo } from '../../../../backups/BackupInfo';
import { broadcastToWindows } from '../../../windows';
import { BackupsIPCMain } from '../BackupsIpc';
import { BackupsProgress } from '../types/BackupsProgress';
import { IndividualBackupProgress } from '../types/IndividualBackupProgress';
import { logger } from '@/apps/shared/logger/logger';

export class BackupsProcessTracker {
  private processed = 0;
  private total = 0;

  private current: IndividualBackupProgress = {
    total: 0,
    processed: 0,
  };

  private abortController: AbortController | undefined;

  private notify() {
    if (this.abortController && !this.abortController.signal.aborted) {
      logger.debug({ tag: 'BACKUPS', msg: 'Progress', progress: this.progress() });
      broadcastToWindows({ name: 'backup-progress', data: this.progress() });
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

  BackupsIPCMain.on('backups.get-last-progress', () => {
    // si hat un backup en progreso entonces notificar el progreso
    if (tracker.currentIndex() > 0) {
      tracker.notifyLastProgress();
    }
  });

  return tracker;
}
