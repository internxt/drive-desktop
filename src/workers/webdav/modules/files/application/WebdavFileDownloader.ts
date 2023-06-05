import { Readable } from 'stream';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { RemoteFileContentsRepository } from '../domain/FileContentRepository';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDownloader {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly contents: RemoteFileContentsRepository,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  async run(path: string): Promise<Readable> {
    const file = this.repository.search(path);

    if (!file) {
      throw new Error('File not found');
    }

    const remoteFileContents = await this.contents.download(file);

    this.eventBus.publish(remoteFileContents.pullDomainEvents());

    return remoteFileContents.contents;
  }
}
