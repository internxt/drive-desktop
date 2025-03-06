import { isTemporaryFile } from '../../../../apps/utils/isTemporalFile';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';
import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly fileSyncronizer: FileSyncronizer,
  ) {}

  async run(absolutePaths: string[]): Promise<void> {
    const filesWithIssues = await ipcRenderer.invoke('FIND_DANGLED_FILES');

    Logger.debug('Dangled files checking');

    const issuePathFiles = [];

    const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
    const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

    for (const file of filesWithIssues) {
      const fileDate = new Date(file.createdAt).getTime();

      if (fileDate >= startDate && fileDate <= endDate) {
        issuePathFiles.push(file.fileId);
      }
    }

    if (issuePathFiles.length > 0) {
      Logger.debug(`Dangled files files: ${issuePathFiles}`);
      const overridedFiles = await this.fileSyncronizer.overrideDangledFiles(
        issuePathFiles,
        this.contentsUploader.run.bind(this.contentsUploader),
        this.contentsManagerFactory,
      );

      Logger.debug(`Processed dangled files: ${overridedFiles}`);
      const toUpdateInDatabase = overridedFiles.reduce((acc: string[], current) => {
        if (current.updated) {
          acc.push(current.contentsId);
        }
        return acc;
      }, []);

      Logger.debug(`Updating dangled files in database: ${toUpdateInDatabase}`);

      await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
        itemIds: toUpdateInDatabase,
        fileFilter: { status: 'DELETED' },
      });
    }

    for (const absolutePath of absolutePaths) {
      const tempFile = await isTemporaryFile(absolutePath);

      if (tempFile) {
        Logger.debug(`Skipping temporary file: ${absolutePath}`);
        continue;
      }
      try {
        await this.fileSyncronizer.run(absolutePath, this.contentsUploader.run.bind(this.contentsUploader));
      } catch (error) {
        console.error(error);
      }
    }
  }
}
