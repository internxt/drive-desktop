import { logger } from '@/apps/shared/logger/logger';
import { ipcRenderer } from 'electron';

export type MonitorFn = () => Promise<void>;

const DELAY = 60 * 60 * 1000;

export class PollingMonitor {
  private timeout: NodeJS.Timeout | null = null;

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  private setTimeout(fn: MonitorFn) {
    this.clearTimeout();

    this.timeout = setTimeout(async () => {
      const isPermitted = await this.checkIsPermitted();

      if (isPermitted) {
        await fn();
      }

      this.setTimeout(fn);
    }, DELAY);
  }

  private async checkIsPermitted() {
    const isSyncing = await ipcRenderer.invoke('CHECK_SYNC_IN_PROGRESS');
    const isPermitted = !isSyncing;
    logger.debug({ msg: '[START FALLBAK] Checking permission to start polling', isSyncing, isPermitted });
    return isPermitted;
  }

  start(fn: MonitorFn) {
    this.setTimeout(fn);
  }

  stop() {
    this.clearTimeout();
  }
}
