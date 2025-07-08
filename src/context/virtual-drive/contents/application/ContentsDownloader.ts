import Logger from 'electron-log';
import path from 'path';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { ipcRendererSyncEngine } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { File } from '../../files/domain/File';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import { TemporalFolderProvider } from './temporalFolderProvider';
import { CallbackDownload } from '../../../../apps/sync-engine/BindingManager';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { EnvironmentContentFileDownloader } from '../infrastructure/download/EnvironmentContentFileDownloader';

export class ContentsDownloader {
  constructor(
    private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
    private readonly temporalFolderProvider: TemporalFolderProvider,
  ) {}

  private downloaderIntance: EnvironmentContentFileDownloader | null = null;
  private downloaderIntanceCB: CallbackDownload | null = null;
  private downloaderFile: File | null = null;

  private async registerEvents(downloader: EnvironmentContentFileDownloader, file: File, callback: CallbackDownload) {
    const location = await this.temporalFolderProvider();
    ensureFolderExists(location);

    const filePath = path.join(location, file.nameWithExtension);

    downloader.on('start', () => {
      ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
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
        nameWithExtension: file.nameWithExtension,
        progress,
      });
    });

    downloader.on('error', (error: Error) => {
      Logger.error('[Server] Error downloading file', error);
      ipcRendererSyncEngine.send('FILE_DOWNLOAD_ERROR', {
        nameWithExtension: file.nameWithExtension,
      });
    });

    downloader.on('finish', () => {
      // cb(true, filePath);
      // The file download being finished does not mean it has been hidratated
      // TODO: We might want to track this time instead of the whole completion time
    });
  }

  async run(file: File, callback: CallbackDownload): Promise<string> {
    // TODO: If we remove the wait, the tests fail
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const downloader = await this.managerFactory.downloader();

    this.downloaderIntance = downloader;
    this.downloaderIntanceCB = callback;
    this.downloaderFile = file;
    await this.registerEvents(downloader, file, callback);

    const readable = await downloader.download(file);

    const localContents = LocalFileContents.downloadedFrom(file, readable);

    const write = await this.localWriter.write(localContents);

    return write;
  }

  stop() {
    Logger.info('[Server] Stopping download 1');
    if (!this.downloaderIntance || !this.downloaderIntanceCB || !this.downloaderFile) return;

    Logger.info('[Server] Stopping download 2');
    this.downloaderIntance.forceStop();
    void this.downloaderIntanceCB(false, '');

    ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', {
      nameWithExtension: this.downloaderFile.nameWithExtension,
    });

    this.downloaderIntanceCB = null;
    this.downloaderIntance = null;
    this.downloaderFile = null;
  }
}
