import { WebdavIpc } from '../../../ipc';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDeleter {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  async run(file: WebdavFile): Promise<void> {
    file.trash();

    await this.repository.delete(file);

    await this.eventBus.publish(file.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_DELETED', {
      name: file.name,
      type: file.type,
      size: file.size,
    });
  }
}
