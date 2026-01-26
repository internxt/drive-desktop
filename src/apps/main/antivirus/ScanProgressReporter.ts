import eventBus from '../event-bus';
import { ProgressData } from './types';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export interface ScanProgress {
  currentPath: string;
  scannedFiles: number;
  totalFiles: number;
  infectedFiles: string[];
  isCompleted: boolean;
}

export class ScanProgressReporter {
  private scannedCount = 0;
  private infectedFiles: string[] = [];
  private totalFiles = 0;
  private currentPath = '';

  constructor(totalFiles: number) {
    this.totalFiles = totalFiles;
  }

  reportFileScanned(filePath: string, isInfected: boolean) {
    this.scannedCount++;
    this.currentPath = filePath;

    if (isInfected) {
      this.infectedFiles.push(filePath);
      logger.warn({
        tag: 'ANTIVIRUS',
        msg: `INFECTED FILE FOUND: ${filePath}`,
      });
    }

    if (this.scannedCount % 100 === 0 || isInfected) {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Progress: ${this.scannedCount}/${this.totalFiles} (${this.calculateProgressPercentage()}%)`,
      });
    }

    this.emit();
  }

  reportCompleted() {
    this.emit(true);
  }

  getProgress(): ScanProgress {
    return {
      currentPath: this.currentPath,
      scannedFiles: this.scannedCount,
      totalFiles: this.totalFiles,
      infectedFiles: [...this.infectedFiles],
      isCompleted: this.scannedCount >= this.totalFiles,
    };
  }

  private emit(forceCompleted = false) {
    const progress = this.getProgress();

    const progressData: ProgressData = {
      currentScanPath: progress.currentPath,
      totalScannedFiles: progress.scannedFiles,
      progress: this.calculateProgressPercentage(),
      infectedFiles: progress.infectedFiles,
      done: forceCompleted || progress.isCompleted,
      scanId: `scan-${Date.now()}`,
    };

    eventBus.emit('ANTIVIRUS_SCAN_PROGRESS', progressData);
  }

  private calculateProgressPercentage() {
    if (this.totalFiles === 0) return 0;
    if (this.scannedCount >= this.totalFiles) return 100;
    return Math.min(Math.floor((this.scannedCount / this.totalFiles) * 100), 99);
  }
}
