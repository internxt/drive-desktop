import { logger } from '@/apps/shared/logger/logger';
import { ScanResult } from './types';
import { scanFile } from './scan-file';
import { findMpCmdRun } from './find-mcp-command';

export class AntivirusWindowsDefender {
  isInitialized = false;
  mpCmdRunPath = '';

  static async createInstance(): Promise<AntivirusWindowsDefender> {
    const instance = new AntivirusWindowsDefender();
    await instance.initialize();
    return instance;
  }

  initialize(): Promise<void> {
    try {
      this.mpCmdRunPath = findMpCmdRun();
      this.isInitialized = true;
      return Promise.resolve();
    } catch (error) {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'Error Initializing Windows Defender',
        error,
      });
      return Promise.reject(error);
    }
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    if (!this.isInitialized) {
      throw new Error('Windows Defender is not initialized');
    }
    return await scanFile(filePath, this.mpCmdRunPath);
  }

  stop(): void {
    this.isInitialized = false;
  }
}
