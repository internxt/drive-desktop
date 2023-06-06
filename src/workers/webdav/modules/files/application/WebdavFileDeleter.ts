import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileDeletedDomainEvent } from '../domain/FileDeletedDomainEvent';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDeleter {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  async run(file: WebdavFile): Promise<void> {
    await this.repository.delete(file);

    const fileDeletedEvent = new FileDeletedDomainEvent({
      aggregateId: file.fileId,
      size: file.size.value,
    });

    this.eventBus.publish([fileDeletedEvent]);
  }
}
