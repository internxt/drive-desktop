import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { RemoteFileContentsRepository } from '../domain/RemoteFileContentsRepository';
import { RemoteFileContents } from '../domain/RemoteFileContent';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { FilePath } from '../domain/FilePath';

export class WebdavFileDownloader {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly contents: RemoteFileContentsRepository,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  async run(path: string): Promise<RemoteFileContents> {
    const filePath = new FilePath(path);
    const file = this.repository.search(filePath);

    if (!file) {
      throw new FileNotFoundError(path);
    }

    const readable = await this.contents.download(file);

    const remoteContents = RemoteFileContents.preview(file, readable);

    await this.eventBus.publish(remoteContents.pullDomainEvents());

    return remoteContents;
  }
}
