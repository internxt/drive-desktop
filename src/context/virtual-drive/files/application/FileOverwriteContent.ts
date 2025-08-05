import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FileCheckerStatusInRoot } from './FileCheckerStatusInRoot';
import { ensureFolderExists } from '@/apps/shared/fs/ensure-folder-exists';
import { temporalFolderProvider } from '../../contents/application/temporalFolderProvider';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { File } from '../domain/File';
import { DangledFilesManager } from '../../shared/domain/DangledFilesManager';
import { FileContentsHardUpdater } from './FileContentsHardUpdater';
import { EnvironmentContentFileDownloader } from '../../contents/infrastructure/download/EnvironmentContentFileDownloader';
import { logger } from '@/apps/shared/logger/logger';

export class FileOverwriteContent {
  private processingErrorQueue: boolean;
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly fileCheckerStatusInRoot: FileCheckerStatusInRoot,
    private readonly fileContentsHardUpdater: FileContentsHardUpdater,
  ) {
    this.processingErrorQueue = false;
  }

  private errorQueue: Array<{
    file: File;
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

  private enqueueError(input: { file: File; callback: (remoteDangledFile: string) => Promise<void> }) {
    const { file, callback } = input;
    this.errorQueue.push({ file, callback });
    void this.processErrorQueue();
  }

  private async registerEvents(input: {
    downloader: EnvironmentContentFileDownloader;
    file: File;
    callback: (remoteDangledFile: string) => Promise<void>;
  }) {
    const { downloader, file, callback } = input;
    const location = await temporalFolderProvider();
    ensureFolderExists(location);

    downloader.on('start', () => {
      logger.debug({ msg: 'Downloading file start', path: file.path });
    });

    downloader.on('progress', () => {
      logger.debug({ msg: 'Downloading file force stop', path: file.path });
      downloader.forceStop();
    });

    downloader.on('error', (error: Error) => {
      logger.error({ msg: 'Error downloading file', error, path: file.path });
      if (error.message.includes('Object not found')) {
        this.enqueueError({ file, callback });
      } else {
        logger.error({ msg: 'Error downloading file', error });
      }
    });
  }

  async run(input: { contentsIds: File['contentsId'][]; downloaderManger: EnvironmentRemoteFileContentsManagersFactory }) {
    const { contentsIds, downloaderManger } = input;
    logger.debug({ msg: 'Inside overrideDangledFiles' });
    const files = this.repository.searchByContentsIds(contentsIds);

    logger.debug({ msg: 'files fetched in overrideDangledFiles', files });

    const filesWithContentLocally = this.fileCheckerStatusInRoot.isHydrated(files.map((file) => file.path));

    logger.debug({ msg: 'filesWithContentLocally', filesWithContentLocally });

    const asynchronousFixingOfDangledFiles = async (remoteDangledFile: string) => {
      const hydratedDangledRemoteFile = files.find((file) => remoteDangledFile == file.contentsId);

      if (!hydratedDangledRemoteFile) {
        logger.error({ msg: 'File not found in local files', remoteDangledFile });
        return;
      }

      logger.debug({ msg: 'hydratedDangledRemoteFile ', id: hydratedDangledRemoteFile.contentsId, path: hydratedDangledRemoteFile.path });

      if (!hydratedDangledRemoteFile.folderUuid) return;
      await this.fileContentsHardUpdater.run({
        attributes: {
          contentsId: hydratedDangledRemoteFile.contentsId,
          folderUuid: hydratedDangledRemoteFile.folderUuid.value,
          size: hydratedDangledRemoteFile.size,
          path: hydratedDangledRemoteFile.path,
        },
      });
    };

    for (const file of files) {
      if (filesWithContentLocally[file.path]) {
        const downloader = downloaderManger.downloader();
        void this.registerEvents({ downloader, file, callback: asynchronousFixingOfDangledFiles });

        logger.debug({ msg: 'Trying to download file ', uuid: file.uuid, name: file.name });
        await downloader.download(file);

        logger.debug({ msg: 'Possible dangled file hydrated', path: file.path });
        DangledFilesManager.getInstance().add({ contentId: file.contentsId, path: file.path });
      } else {
        logger.debug({ msg: 'Possible dangled file not hydrated', path: file.path });
      }
    }
  }
}
