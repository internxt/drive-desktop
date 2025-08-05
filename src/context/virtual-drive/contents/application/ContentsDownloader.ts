import path from 'path';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { LocalFileContents } from '../domain/LocalFileContents';
import { CallbackDownload } from '../../../../apps/sync-engine/BindingManager';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';
import { FSLocalFileWriter } from '../infrastructure/FSLocalFileWriter';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { temporalFolderProvider } from './temporalFolderProvider';
import { logger } from '@/apps/shared/logger/logger';

export class ContentsDownloader {
  constructor(
    private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly localWriter: FSLocalFileWriter,
  ) {}

  private downloaderIntance: EnvironmentContentFileDownloader | null = null;
  private downloaderIntanceCB: CallbackDownload | null = null;
  private downloaderFile: SimpleDriveFile | null = null;

  private async registerEvents(downloader: EnvironmentContentFileDownloader, file: SimpleDriveFile, callback: CallbackDownload) {
    const location = await temporalFolderProvider();
    ensureFolderExists(location);

    const filePath = path.join(location, file.nameWithExtension);

    downloader.on('start', () => {
      ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
        key: file.uuid,
        nameWithExtension: file.nameWithExtension,
        progress: 0,
      });
    });

    downloader.on('progress', async () => {
      const { finished, progress } = await callback(true, filePath);

      if (progress > 1 || progress < 0) {
        throw new Error('Result progress is not between 0 and 1');
      } else if (finished && progress === 0) {
        throw new Error('Result progress is 0');
      }

      ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
        key: file.uuid,
        nameWithExtension: file.nameWithExtension,
        progress,
      });
    });

    downloader.on('error', (error: Error) => {
      logger.error({ msg: '[Server] Error downloading file', error });
      ipcRendererSyncEngine.send('FILE_DOWNLOAD_ERROR', {
        key: file.uuid,
        nameWithExtension: file.nameWithExtension,
      });
    });

    downloader.on('finish', () => {
      // cb(true, filePath);
      // The file download being finished does not mean it has been hidratated
      // TODO: We might want to track this time instead of the whole completion time
    });
  }

  async run(file: SimpleDriveFile, callback: CallbackDownload): Promise<string> {
    // TODO: If we remove the wait, the tests fail
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const downloader = await this.managerFactory.downloader();

    this.downloaderIntance = downloader;
    this.downloaderIntanceCB = callback;
    this.downloaderFile = file;
    await this.registerEvents(downloader, file, callback);

    const readable = await downloader.download({ contentsId: file.contentsId });

    const localContents = LocalFileContents.downloadedFrom(file, readable);

    const write = await this.localWriter.write(localContents);

    return write;
  }

  stop() {
    logger.debug({ msg: '[Server] Stopping download 1' });
    if (!this.downloaderIntance || !this.downloaderIntanceCB || !this.downloaderFile) return;

    logger.debug({ msg: '[Server] Stopping download 2' });
    this.downloaderIntance.forceStop();
    void this.downloaderIntanceCB(false, '');

    ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', {
      key: this.downloaderFile.uuid,
      nameWithExtension: this.downloaderFile.nameWithExtension,
    });

    this.downloaderIntanceCB = null;
    this.downloaderIntance = null;
    this.downloaderFile = null;
  }
}
