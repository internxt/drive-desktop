import { logger } from '@/apps/shared/logger/logger';
import { scanFile } from './scan-file';
import { findMpCmdRun } from './find-mcp-command';

export class AntivirusWindowsDefender {
  isInitialized = false;
  mpCmdRunPath = '';

  static async createInstance() {
    const instance = new AntivirusWindowsDefender();
    await instance.initialize();
    return instance;
  }

  async initialize() {
    try {
      this.mpCmdRunPath = await findMpCmdRun();
      this.isInitialized = true;
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error initializing antivirus',
        error,
      });
    }
  }

  async scanFile({ filePath }: { filePath: string }) {
    if (!this.isInitialized) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Antivirus is not initialized',
      });
      return;
    }
    return await scanFile({ filePath, mpCmdRunPath: this.mpCmdRunPath });
  }

  stop() {
    this.isInitialized = false;
  }
}
