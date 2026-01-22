import { BackupConfiguration } from '../../../apps/main/background-processes/backups/BackupConfiguration/BackupConfiguration';
import { BackupErrorsTracker } from './backup-errors-tracker';
import { BackupScheduler } from '../../../apps/main/background-processes/backups/BackupScheduler/BackupScheduler';
import { BackupsProcessStatus } from '../../../apps/main/background-processes/backups/BackupsProcessStatus/BackupsProcessStatus';
import { BackupProgressTracker } from './backup-progress-tracker';
import { launchBackupProcesses } from './launch-backup-processes';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupsStatus } from '../../../apps/main/background-processes/backups/BackupsProcessStatus/BackupsStatus';

export class BackupManager {
  private scheduler: BackupScheduler;
  private abortController = new AbortController();

  constructor(
    private status: BackupsProcessStatus,
    private tracker: BackupProgressTracker,
    private errors: BackupErrorsTracker,
    private config: BackupConfiguration,
  ) {
    this.scheduler = new BackupScheduler(
      () => config.lastBackup,
      () => config.backupInterval,
      () => this.startBackup(),
    );
  }

  public async startBackup(): Promise<void> {
    if (!this.config.enabled) {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups are disabled, not starting' });
      return;
    }

    if (this.isBackupRunning()) {
      logger.debug({ tag: 'BACKUPS', msg: 'Backup already running, skipping' });
      return;
    }

    this.abortController = new AbortController();
    this.errors.clear();
    this.changeBackupStatus('RUNNING');

    try {
      await launchBackupProcesses(this.tracker, this.errors, this.abortController.signal);
    } finally {
      this.changeBackupStatus('STANDBY');
      this.tracker.reset();
    }
  }

  public stopBackup(): void {
    if (!this.isBackupRunning()) {
      logger.debug({ tag: 'BACKUPS', msg: 'No backup running to stop' });
      return;
    }

    this.abortController.abort();
  }

  public startScheduler(): Promise<void> {
    return this.scheduler.start();
  }

  public stopScheduler(): void {
    this.scheduler.stop();
  }

  public rescheduleBackups(): void {
    this.scheduler.reschedule();
  }

  public stopAndClearBackups() {
    if (this.scheduler) this.scheduler.stop();
    this.errors.clear();
    this.tracker.reset();
    this.abortController = new AbortController();
    this.changeBackupStatus('STANDBY');
  }

  public isScheduled(): boolean {
    return this.scheduler.isScheduled();
  }

  public isBackupRunning(): boolean {
    return this.status.isIn('RUNNING');
  }

  public changeBackupStatus(status: BackupsStatus): void {
    this.status.set(status);
  }
}
