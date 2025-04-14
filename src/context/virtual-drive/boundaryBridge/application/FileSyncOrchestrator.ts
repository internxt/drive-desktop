import { logger } from '@/apps/shared/logger/logger';
import { isTemporaryFile } from '../../../../apps/utils/isTemporalFile';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';
import Logger from 'electron-log';

export class FileSyncOrchestrator {
  constructor(private readonly fileSyncronizer: FileSyncronizer) {}

  async run(absolutePaths: string[]): Promise<void> {
    for (const absolutePath of absolutePaths) {
      const tempFile = isTemporaryFile(absolutePath);

      if (tempFile) {
        Logger.debug(`Skipping temporary file: ${absolutePath}`);
        continue;
      }

      try {
        await this.fileSyncronizer.run(absolutePath);
      } catch (exc) {
        logger.error({
          msg: 'Failed file sync orchestrator',
          absolutePath,
          tempFile,
          exc,
        });
      }
    }
  }
}
