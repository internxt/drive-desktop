import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { VirtualDriveIpc } from '../../../ipc';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { File } from '../../files/domain/File';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';

export class ContentsDownloader {
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
    private readonly ipc: VirtualDriveIpc
  ) {}

  private registerEvents(downloader: ContentFileDownloader, file: File) {
    downloader.on('start', () => {
      this.ipc.send('WEBDAV_FILE_DOWNLOADING', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: { elapsedTime: downloader.elapsedTime() },
      });
    });

    downloader.on('progress', (progress: number) => {
      this.ipc.send('WEBDAV_FILE_DOWNLOADING', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
        processInfo: { elapsedTime: downloader.elapsedTime(), progress },
      });
    });

    downloader.on('error', (error: Error) => {
      this.ipc.send('WEBDAV_FILE_DOWNLOAD_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: error.message,
      });
    });

    downloader.on('finish', () => {
      this.ipc.send('WEBDAV_FILE_DOWNLOADED', {
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

    const readable = await downloader.download(file);

    const localContents = LocalFileContents.from({
      name: file.name,
      extension: file.type,
      size: file.size,
      birthTime: file.createdAt.getUTCMilliseconds(),
      modifiedTime: file.updatedAt.getUTCMilliseconds(),
      contents: readable,
    });

    return await this.localWriter.write(localContents);
  }
}
