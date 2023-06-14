import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { RemoteFileContentsRepository } from '../domain/RemoteFileContentsRepository';
import { RemoteFileContents } from '../domain/RemoteFileContent';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { FilePath } from '../domain/FilePath';
import { WebdavIpc } from 'workers/webdav/ipc';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';
import { ContentFileDownloader } from '../domain/ContentFileDownloader';
import { WebdavFile } from '../domain/WebdavFile';

export class WebdavFileDownloader {
  private stopwatch: Stopwatch;

  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly contents: RemoteFileContentsRepository,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {
    this.stopwatch = new Stopwatch();
  }

  private registerEvents(downloader: ContentFileDownloader, file: WebdavFile) {
    downloader.on('start', () => {
      this.stopwatch.start();
    });

    downloader.on('finish', () => {
      this.stopwatch.finish();

      this.ipc.send('WEBDAV_FILE_DOWNLOADED', {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadInfo: { elapsedTime: this.stopwatch.elapsedTime() },
      });
    });
  }

  async run(path: string): Promise<RemoteFileContents> {
    const filePath = new FilePath(path);
    const file = this.repository.search(filePath);

    if (!file) {
      throw new FileNotFoundError(path);
    }

    const downloader = this.contents.downloader(file);

    this.registerEvents(downloader, file);

    const readable = await downloader.download();

    const remoteContents = RemoteFileContents.preview(file, readable);

    await this.eventBus.publish(remoteContents.pullDomainEvents());

    return remoteContents;
  }
}
