import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { ipcRenderer } from 'electron';
import { FileOverwriteContent } from '../../files/application/FileOverwriteContent';
import { DangledFilesManager, PushAndCleanInput } from '../../shared/domain/DangledFilesManager';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';

export class FileDangledManager {
  constructor(
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
    const filesToCheck: DriveFile[] = await ipcRendererSyncEngine.invoke('FIND_DANGLED_FILES');

    logger.debug({ msg: 'Dangled files checking', total: filesToCheck.length });

    const dangledFilesIds = [];
    const healthyFilesIds: string[] = [];

    const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
    const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

    for (const file of filesToCheck) {
      const fileDate = new Date(file.createdAt).getTime();

      if (fileDate >= startDate && fileDate <= endDate) {
        logger.debug({ msg: `File ${file.plainName} is in the range` });
        dangledFilesIds.push(file.fileId);
      } else {
        healthyFilesIds.push(file.fileId);
      }
    }

    logger.debug({ msg: 'Dangled files', total: dangledFilesIds.length });
    logger.debug({ msg: 'Healthy files', total: healthyFilesIds.length });

    if (healthyFilesIds.length) {
      await ipcRendererSyncEngine.invoke('SET_HEALTHY_FILES', healthyFilesIds);
    }

    if (dangledFilesIds.length > 0) {
      logger.debug({ msg: `Dangled files: ${dangledFilesIds}` });
      await this.fileOverwriteContent.run({
        contentsIds: dangledFilesIds,
        downloaderManger: this.contentsManagerFactory,
      });
    }
  }
}
