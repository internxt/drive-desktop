import { getIsLoggedIn } from '../../../auth/handlers';
import configStore from '../../../config';
import { BACKUP_MANUAL_INTERVAL } from '../types/types';

export class BackupScheduler {
  private static schedule: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private readonly lastBackup: () => number,
    private readonly interval: () => number,
    private readonly task: () => Promise<void>,
  ) {}

  async start(): Promise<void> {
    if (!this.intervalIsSet()) {
      return;
    }

    const delay = this.lastBackupIsSet() ? this.millisecondsToNextBackup() : this.interval();

    if (delay <= 0) {
      await this.runAndScheduleNext();
    } else {
      BackupScheduler.schedule = setTimeout(() => this.runAndScheduleNext(), delay);
    }
  }

  millisecondsToNextBackup(): number {
    const currentTimestamp = new Date().valueOf();
    const nextBackupAt = this.lastBackup() + this.interval();
    return nextBackupAt - currentTimestamp;
  }

  shouldDoBackup(): boolean {
    return this.millisecondsToNextBackup() <= 0;
  }

  private async runAndScheduleNext(): Promise<void> {
    await this.task();
    this.updateLastBackup();

    if (getIsLoggedIn() && this.intervalIsSet()) {
      BackupScheduler.schedule = setTimeout(() => this.runAndScheduleNext(), this.interval());
    }
  }

  private lastBackupIsSet(): boolean {
    return this.lastBackup() !== BACKUP_MANUAL_INTERVAL;
  }

  private intervalIsSet(): boolean {
    return this.interval() !== BACKUP_MANUAL_INTERVAL;
  }

  private updateLastBackup(): void {
    configStore.set('lastBackup', Date.now());
  }

  stop(): void {
    if (BackupScheduler.schedule) {
      clearTimeout(BackupScheduler.schedule);
    }
  }

  isScheduled(): boolean {
    return BackupScheduler.schedule !== null;
  }

  reschedule(): void {
    this.stop();
    this.start();
  }
}
