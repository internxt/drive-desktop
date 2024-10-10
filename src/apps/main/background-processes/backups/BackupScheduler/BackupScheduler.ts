import { getIsLoggedIn } from '../../../auth/handlers';
import configStore from '../../../config';

export class BackupScheduler {
  private static schedule: null | ReturnType<typeof setTimeout> = null;

  constructor(
    private readonly lastBackup: () => number,
    private readonly interval: () => number,
    private readonly task: () => Promise<void>
  ) {}

  async start(): Promise<void> {
    if (!this.lastBackupIsSet()) {
      return;
    }

    if (!this.intervalIsSet()) {
      return;
    }

    const millisecondsToNextBackup = this.millisecondsToNextBackup();

    if (millisecondsToNextBackup <= 0) {
      await this.runAndScheduleNext();
      return;
    }

    BackupScheduler.schedule = setTimeout(
      () => this.runAndScheduleNext(),
      millisecondsToNextBackup
    );
  }

  private millisecondsToNextBackup(): number {
    const currentTimestamp = new Date().valueOf();

    return this.lastBackup() + this.interval() - currentTimestamp;
  }

  private async runAndScheduleNext(): Promise<void> {
    await this.task();
    this.updateLastBackup();

    if (!this.lastBackupIsSet()) {
      return;
    }

    if (!this.intervalIsSet()) {
      return;
    }

    if (!getIsLoggedIn()) {
      return;
    }

    BackupScheduler.schedule = setTimeout(() => this.task(), this.interval());
  }

  private lastBackupIsSet(): boolean {
    return this.lastBackup() !== -1;
  }

  private intervalIsSet(): boolean {
    return this.interval() !== -1;
  }

  private updateLastBackup() {
    const currentTimestamp = Date.now();

    configStore.set('lastBackup', currentTimestamp);
  }

  stop(): void {
    if (!BackupScheduler.schedule) return;

    clearTimeout(BackupScheduler.schedule);
  }

  isScheduled(): boolean {
    return BackupScheduler.schedule !== null;
  }

  reschedule(): void {
    this.stop();
    this.start();
  }
}
