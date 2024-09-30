import { isTemporaryFile } from '../../../../apps/utils/isTemporalFile';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';
import Logger from 'electron-log';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileSyncronizer: FileSyncronizer
  ) {}

  async run(absolutePaths: string[]): Promise<void> {
    for (const absolutePath of absolutePaths) {
      const tempFile = await isTemporaryFile(absolutePath);

      Logger.debug('[isTemporaryFile]', tempFile);

      if (tempFile) {
        Logger.debug(`Skipping temporary file: ${absolutePath}`);
        continue;
      }
      try {
        await this.fileSyncronizer.run(
          absolutePath,
          this.contentsUploader.run.bind(this.contentsUploader)
        );
      } catch (error) {
        console.error(error);
      }
    }
  }
}
