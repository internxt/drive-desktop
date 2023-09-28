import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { File } from '../../files/domain/File';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';
import Logger from 'electron-log';

export class ContentsDownloader {
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
    private readonly ipc: SyncEngineIpc
  ) {}

  private registerEvents(downloader: ContentFileDownloader, file: File) {
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

  async run(file: File): Promise<string> {
    const downloader = this.managerFactory.downloader();

    this.registerEvents(downloader, file);

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
    Logger.debug('End write with', stopwatch.elapsedTime);

    return write;
  }
}
