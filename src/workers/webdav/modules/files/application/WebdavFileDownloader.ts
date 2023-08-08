import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { RemoteFileContentsManagersFactory } from '../../contents/domain/RemoteFileContentsManagersFactory';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContent';
import { FileRepository } from '../domain/FileRepository';
import { FilePath } from '../domain/FilePath';
import { WebdavIpc } from '../../../ipc';
import { ContentFileDownloader } from '../domain/ContentFileDownloader';
import { File } from '../domain/File';

export class WebdavFileDownloader {
  constructor(
    private readonly repository: FileRepository,
    private readonly contents: RemoteFileContentsManagersFactory,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
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

  async run(path: string): Promise<RemoteFileContents> {
    const filePath = new FilePath(path);

    const file = this.repository.search(filePath);

    if (!file) {
      throw new FileNotFoundError(path);
    }

    const downloader = this.contents.downloader();

    this.registerEvents(downloader, file);

    const readable = await downloader.download(file);

    const remoteContents = RemoteFileContents.preview(file, readable);

    await this.eventBus.publish(remoteContents.pullDomainEvents());

    return remoteContents;
  }
}
