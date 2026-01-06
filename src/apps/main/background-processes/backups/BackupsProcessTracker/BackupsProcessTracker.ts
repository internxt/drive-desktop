import { BackupInfo } from '../../../../backups/BackupInfo';
import { broadcastToWindows } from '../../../windows';
import { BackupsProgress } from '../types/BackupsProgress';
import { IndividualBackupProgress } from '../types/IndividualBackupProgress';
import { logger } from '@/apps/shared/logger/logger';

export class BackupsProcessTracker {
  processed = 0;
  total = 0;

  private current: IndividualBackupProgress = {
    total: 0,
    processed: 0,
  };

  private abortController: AbortController | undefined;

  notify() {
    if (this.abortController && !this.abortController.signal.aborted) {
      logger.debug({ tag: 'BACKUPS', msg: 'Progress', progress: this.progress() });
      broadcastToWindows({ name: 'backup-progress', data: this.progress() });
    }
  }

  progress(): BackupsProgress {
    return {
      currentFolder: this.processed,
      totalFolders: this.total,
      partial: this.current,
    };
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

export const tracker = new BackupsProcessTracker();

export function getLastBackupProgress() {
  if (tracker.processed > 0) {
    tracker.notify();
  }
}
