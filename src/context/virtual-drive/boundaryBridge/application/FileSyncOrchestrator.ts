import { isTemporaryFile } from '../../../../apps/utils/isTemporalFile';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';
import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly fileSyncronizer: FileSyncronizer,
  ) {}

  async run(absolutePaths: string[]): Promise<void> {
    const filesToCheck: DriveFile[] = await ipcRenderer.invoke('FIND_DANGLED_FILES');

    Logger.debug('Dangled files checking');

    const dangledFilesIds = [];
    const healthyFilesIds: string[] = [];

    const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
    const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

    for (const file of filesToCheck) {
      const fileDate = new Date(file.createdAt).getTime();

      if (fileDate >= startDate && fileDate <= endDate) {
        Logger.debug(`File ${file.plainName} is in the range`);
        dangledFilesIds.push(file.fileId);
      } else {
        healthyFilesIds.push(file.fileId);
      }
    }

    Logger.debug(`Dangled files: ${dangledFilesIds}`);

    Logger.debug(`Healthy files: ${healthyFilesIds}`);
    if (healthyFilesIds.length) {
      await ipcRenderer.invoke('SET_HEALTHY_FILES', healthyFilesIds);
    }

    if (dangledFilesIds.length > 0) {
      Logger.debug(`Dangled files: ${dangledFilesIds}`);
      await this.fileSyncronizer.overrideDangledFiles(
        dangledFilesIds,
        this.contentsUploader.run.bind(this.contentsUploader),
        this.contentsManagerFactory,
      );
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
