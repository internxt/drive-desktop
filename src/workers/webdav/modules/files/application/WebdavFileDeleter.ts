import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDeleter {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  async run(file: WebdavFile): Promise<void> {
    file.trash();

    await this.repository.delete(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }
}
