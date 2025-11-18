import { FileCheckerStatusInRoot } from './FileCheckerStatusInRoot';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { DangledFilesManager } from '../../shared/domain/DangledFilesManager';
import { FileContentsHardUpdater } from './FileContentsHardUpdater';
import { logger } from '@/apps/shared/logger/logger';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

export class FileOverwriteContent {
  private processingErrorQueue: boolean;
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly fileContentsHardUpdater: FileContentsHardUpdater,
  ) {
    this.processingErrorQueue = false;
  }

  private errorQueue: Array<{
    file: ExtendedDriveFile;
    callback: (remoteDangledFile: string) => Promise<void>;
  }> = [];

  private async processErrorQueue() {
    if (this.processingErrorQueue) return;
    this.processingErrorQueue = true;
    while (this.errorQueue.length > 0) {
      const shiftedItem = this.errorQueue.shift();
      if (!shiftedItem) continue;
      const { file, callback } = shiftedItem;
      await callback(file.contentsId);
    }
    this.processingErrorQueue = false;
  }

  private enqueueError(input: { file: ExtendedDriveFile; callback: (remoteDangledFile: string) => Promise<void> }) {
    const { file, callback } = input;
    this.errorQueue.push({ file, callback });
    void this.processErrorQueue();
  }

  async run(ctx: ProcessSyncContext, input: { contentsIds: string[] }) {
    const { contentsIds } = input;
    logger.debug({ msg: 'Inside overrideDangledFiles' });
    const files = this.repository.searchByContentsIds(contentsIds);

    logger.debug({ msg: 'files fetched in overrideDangledFiles', files });

    const filesWithContentLocally = FileCheckerStatusInRoot.isHydrated({ ctx, paths: files.map((file) => file.path) });

    logger.debug({ msg: 'filesWithContentLocally', filesWithContentLocally });

    const asynchronousFixingOfDangledFiles = async (remoteDangledFile: string) => {
      const hydratedDangledRemoteFile = files.find((file) => remoteDangledFile == file.contentsId);

      if (!hydratedDangledRemoteFile) {
        logger.error({ msg: 'File not found in local files', remoteDangledFile });
        return;
      }

      logger.debug({ msg: 'hydratedDangledRemoteFile ', id: hydratedDangledRemoteFile.contentsId, path: hydratedDangledRemoteFile.path });

      if (!hydratedDangledRemoteFile.parentUuid) return;
      await this.fileContentsHardUpdater.run(ctx, {
        attributes: {
          contentsId: hydratedDangledRemoteFile.contentsId,
          folderUuid: hydratedDangledRemoteFile.parentUuid,
          size: hydratedDangledRemoteFile.size,
          path: hydratedDangledRemoteFile.absolutePath,
        },
      });
    };

    for (const file of files) {
      if (filesWithContentLocally[file.path]) {
        logger.debug({ msg: 'Trying to download file ', uuid: file.uuid, name: file.name });

        const { error } = await ctx.contentsDownloader.download({
          path: file.absolutePath,
          contentsId: file.contentsId,
        });

        if (error?.message.includes('Object not found')) {
          this.enqueueError({ file, callback: asynchronousFixingOfDangledFiles });
        } else {
          logger.error({ msg: 'Error downloading file', error });
        }

        logger.debug({ msg: 'Possible dangled file hydrated', path: file.path });
        DangledFilesManager.getInstance().add({ contentId: file.contentsId, path: file.path });
      } else {
        logger.debug({ msg: 'Possible dangled file not hydrated', path: file.path });
      }
    }
  }
}
