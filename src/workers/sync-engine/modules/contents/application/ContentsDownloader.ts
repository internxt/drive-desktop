import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { File } from '../../files/domain/File';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';
import { ensureFolderExists } from 'shared/fs/ensure-folder-exists';
import path from 'path';
import Logger from 'electron-log';
import { buildContentsContainer } from 'workers/sync-engine/dependency-injection/contents/builder';
import { buildSharedContainer } from 'workers/sync-engine/dependency-injection/shared/builder';
import { CallbackDownload } from 'workers/sync-engine/BindingManager';

export class ContentsDownloader {
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
    private readonly ipc: SyncEngineIpc
  ) {}

  private async registerEvents(
    downloader: ContentFileDownloader,
    file: File,
    cb: CallbackDownload
  ) {
    const sharedContainer = buildSharedContainer();
    const contentsContainer = await buildContentsContainer(sharedContainer);
    const location = await contentsContainer.temporalFolderProvider();
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

    downloader.on('progress', (progress: number) => {
      cb(true, filePath);
      this.ipc.send('FILE_DOWNLOADING', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: { elapsedTime: downloader.elapsedTime(), progress },
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
      this.ipc.send('FILE_DOWNLOADED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: { elapsedTime: downloader.elapsedTime() },
      });
    });
  }

  async run(file: File, cb: CallbackDownload): Promise<string> {
    const downloader = this.managerFactory.downloader();

    this.registerEvents(downloader, file, cb);

    const stopwatch = new Stopwatch();

    Logger.debug('Start download');
    stopwatch.start();
    const readable = await downloader.download(file);
    Logger.debug('Download finished with: ', stopwatch.elapsedTime());
    const localContents = LocalFileContents.from({
      name: file.name,
      extension: file.type,
      size: file.size,
      birthTime: file.createdAt.getUTCMilliseconds(),
      modifiedTime: file.updatedAt.getUTCMilliseconds(),
      contents: readable,
    });
    Logger.debug('Start write ');
    stopwatch.reset();
    stopwatch.start();
    const write = await this.localWriter.write(localContents);

    return write;
  }
}
