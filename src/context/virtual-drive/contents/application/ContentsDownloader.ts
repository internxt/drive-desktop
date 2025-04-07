import Logger from 'electron-log';
import path from 'path';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { File } from '../../files/domain/File';
import { EventBus } from '../../shared/domain/EventBus';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { TemporalFolderProvider } from './temporalFolderProvider';
import { CallbackDownload } from '../../../../apps/sync-engine/BindingManager';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';

export class ContentsDownloader {
  constructor(
    private readonly managerFactory: EnvironmentRemoteFileContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
    private readonly ipc: SyncEngineIpc,
    private readonly temporalFolderProvider: TemporalFolderProvider,
    private readonly eventBus: EventBus,
  ) {}

  private downloaderIntance: ContentFileDownloader | null = null;
  private downloaderIntanceCB: CallbackDownload | null = null;
  private downloaderFile: File | null = null;

  private async registerEvents(downloader: ContentFileDownloader, file: File, callback: CallbackDownload) {
    const location = await this.temporalFolderProvider();
    ensureFolderExists(location);

    const filePath = path.join(location, file.nameWithExtension);

    downloader.on('start', () => {
      this.ipc.send('FILE_DOWNLOADING', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: { elapsedTime: downloader.elapsedTime() },
      });
    });

    downloader.on('progress', async () => {
      await callback(true, filePath);
    });

    downloader.on('error', (error: Error) => {
      Logger.error('[Server] Error downloading file', error);
      this.ipc.send('FILE_DOWNLOAD_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: error.message,
      });
    });

    downloader.on('finish', () => {
      // cb(true, filePath);
      // The file download being finished does not mean it has been hidratated
      // TODO: We might want to track this time instead of the whole completion time
    });
  }

  async run(file: File, callback: CallbackDownload): Promise<string> {
    const downloader = await this.managerFactory.downloader();

    this.downloaderIntance = downloader;
    this.downloaderIntanceCB = callback;
    this.downloaderFile = file;
    await this.registerEvents(downloader, file, callback);

    const readable = await downloader.download(file);

    const localContents = LocalFileContents.downloadedFrom(file, readable, downloader.elapsedTime());

    const write = await this.localWriter.write(localContents);

    const events = localContents.pullDomainEvents();
    await this.eventBus.publish(events);

    return write;
  }

  async stop() {
    Logger.info('[Server] Stopping download 1');
    if (!this.downloaderIntance || !this.downloaderIntanceCB || !this.downloaderFile) return;

    Logger.info('[Server] Stopping download 2');
    this.downloaderIntance.forceStop();
    this.downloaderIntanceCB(false, '');

    this.ipc.send('FILE_DOWNLOAD_CANCEL', {
      name: this.downloaderFile.name,
      extension: this.downloaderFile.type,
      nameWithExtension: this.downloaderFile.nameWithExtension,
      size: this.downloaderFile.size,
    });

    this.downloaderIntanceCB = null;
    this.downloaderIntance = null;
    this.downloaderFile = null;
  }
}
