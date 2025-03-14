import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { ipcRenderer } from 'electron';
import { FileOverwriteContent } from '../../files/application/FileOverwriteContent';
import Logger from 'electron-log';
import { DangledFilesManager, PushAndCleanInput } from '../../shared/domain/DangledFilesManager';

export class FileDangledManager {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly contentsManagerFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly fileOverwriteContent: FileOverwriteContent,
  ) {}

  async run(): Promise<void> {
    await DangledFilesManager.getInstance().pushAndClean(async (input: PushAndCleanInput) => {
      await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
        toUpdate: input.toUpdateContentsIds,
        toDelete: input.toDeleteContentsIds,
      });
    });
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
      await this.fileOverwriteContent.run({
        contentsIds: dangledFilesIds,
        upload: this.contentsUploader.run.bind(this.contentsUploader),
        downloaderManger: this.contentsManagerFactory,
      });
    }
  }
}
