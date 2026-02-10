import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupInfo } from '../../../../backups/BackupInfo';
import { broadcastToWindows } from '../../../windows';
import { BackupsStatus } from '../BackupsProcessStatus/BackupsStatus';
import { BackupsProgress } from '../types/BackupsProgress';
import { IndividualBackupProgress } from '../types/IndividualBackupProgress';
import { logger } from '@/apps/shared/logger/logger';

export class BackupsProcessTracker {
  status: BackupsStatus = 'STANDBY';
  processed = 0;
  total = 0;

  current: IndividualBackupProgress = {
    total: 0,
    processed: 0,
  };

  private abortController: AbortController | undefined;

  notify(path?: AbsolutePath) {
    if (this.abortController && !this.abortController.signal.aborted) {
      broadcastToWindows({ name: 'backup-progress', data: this.progress() });
      logger.debug({
        tag: 'BACKUPS',
        msg: 'Progress',
        ...(path && { path }),
        total: this.current.total,
        processed: this.current.processed,
      });
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

  currentTotal(total: number, backed: number) {
    this.current.total = total;
    this.current.processed = backed;
    this.notify();
  }

  currentProcessed(path: AbsolutePath) {
    this.current.processed++;
    this.notify(path);
  }

  setStatus(status: BackupsStatus) {
    this.status = status;
    broadcastToWindows({ name: 'backups-status-changed', data: status });
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
