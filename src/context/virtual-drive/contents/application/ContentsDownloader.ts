import Logger from 'electron-log';
import path from 'path';
import { Readable } from 'stream';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { CallbackDownload } from '../../../../apps/sync-engine/BindingManager';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { File } from '../../files/domain/File';
import { EventBus } from '../../shared/domain/EventBus';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { TemporalFolderProvider } from './temporalFolderProvider';
import * as fs from 'fs';

export class ContentsDownloader {
  private readableDownloader: Readable | null;
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
    private readonly ipc: SyncEngineIpc,
    private readonly temporalFolderProvider: TemporalFolderProvider,
    private readonly eventBus: EventBus
  ) {
    this.readableDownloader = null;
  }

  private async registerEvents(downloader: ContentFileDownloader, file: File) {
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
      Logger.debug('[Server] Download progress', filePath);

      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const progress = fileSizeInBytes / file.size;

      this.ipc.send('FILE_DOWNLOADING', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: {
          elapsedTime: downloader.elapsedTime(),
          progress,
        },
      });
    });

    downloader.on('error', (error: Error) => {
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

  async run(file: File): Promise<string> {
    const downloader = this.managerFactory.downloader();

    await this.registerEvents(downloader, file);

    const readable = await downloader.download(file);
    this.readableDownloader = readable;

    const localContents = LocalFileContents.downloadedFrom(
      file,
      readable,
      downloader.elapsedTime()
    );

    const write = await this.localWriter.write(localContents);

    const events = localContents.pullDomainEvents();
    await this.eventBus.publish(events);

    this.ipc.send('FILE_DOWNLOADED', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
      processInfo: { elapsedTime: downloader.elapsedTime() },
    });

    return write;
  }
}
