import Logger from 'electron-log';
import path from 'path';
import { Readable } from 'stream';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { CallbackDownload } from '../../../../apps/sync-engine/BindingManager';
import { SyncEngineIpc } from '../../../../apps/sync-engine/SyncEngineIpc';
import { File } from '../../files/domain/File';
import { EventBus } from '../../shared/domain/EventBus';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalFileContents } from '../domain/LocalFileContents';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import { LocalFileContentsDirectoryProvider } from '../../shared/domain/LocalFileContentsDirectoryProvider';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';

export class ContentsDownloader {
  private readableDownloader: Readable | null;
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localFileSystem: LocalFileSystem,
    private readonly ipc: SyncEngineIpc,
    private readonly localFileContentsDirectoryProvider: LocalFileContentsDirectoryProvider,
    private readonly eventBus: EventBus
  ) {
    this.readableDownloader = null;
  }

  private async registerEvents(
    downloader: ContentFileDownloader,
    file: File,
    cb: CallbackDownload
  ) {
    const location = await this.localFileContentsDirectoryProvider.provide();
    const folderPath = path.join(location, 'internxt');
    ensureFolderExists(folderPath);
    const filePath = path.join(folderPath, file.nameWithExtension);

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
      const result = await cb(true, filePath);
      const hydrationProgress = result.progress;

      if (result.finished) {
        downloader.forceStop();
        Logger.debug('Downloader force stop', this.readableDownloader);
        this.readableDownloader?.destroy();
        this.readableDownloader?.emit('close');
        this.ipc.send('FILE_DOWNLOADED', {
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          size: file.size,
          processInfo: { elapsedTime: downloader.elapsedTime() },
        });
      } else {
        this.ipc.send('FILE_DOWNLOADING', {
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          size: file.size,
          processInfo: {
            elapsedTime: downloader.elapsedTime(),
            progress: hydrationProgress,
          },
        });
      }
    });

    downloader.on('error', (error: Error) => {
      const cause =
        error instanceof DriveDesktopError ? error.syncErrorCause : 'UNKNOWN';

      this.ipc.send('FILE_DOWNLOAD_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        cause,
      });
    });

    downloader.on('finish', () => {
      // The file download being finished does not mean it has been hydrated
      // TODO: We might want to track this time instead of the whole completion time
    });
  }

  async run(file: File, cb: CallbackDownload): Promise<string> {
    const downloader = this.managerFactory.downloader();

    this.registerEvents(downloader, file, cb);

    const readable = await downloader.download(file);
    this.readableDownloader = readable;
    const localContents = LocalFileContents.downloadedFrom(
      file,
      readable,
      downloader.elapsedTime()
    );

    const write = await this.localFileSystem.write(localContents);

    const events = localContents.pullDomainEvents();
    await this.eventBus.publish(events);

    return write;
  }
}
