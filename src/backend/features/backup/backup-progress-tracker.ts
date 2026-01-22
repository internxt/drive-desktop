import { logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastToWindows } from '../../../apps/main/windows';

export class BackupProgressTracker {
  private totalItems = 0;
  private processedItems = 0;

  addToTotal(totalBackups: number): void {
    this.totalItems += totalBackups;
  }

  reset() {
    this.processedItems = 0;
    this.totalItems = 0;
  }

  incrementProcessed(count: number): void {
    this.processedItems += count;
    this.emitProgress();
  }

  getPercentage(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(100, Math.round((this.processedItems / this.totalItems) * 100));
  }

  private emitProgress(): void {
    const percentage = this.getPercentage();
    logger.debug({ tag: 'BACKUPS', msg: 'Progress update', percentage });
    broadcastToWindows('backup-progress', percentage);
  }
}
