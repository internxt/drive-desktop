import { WebdavIpc } from '../../../ipc';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class WebdavFileDeleter {
  constructor(
    private readonly repository: FileRepository,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  async run(file: File): Promise<void> {
    this.ipc.send('WEBDAV_FILE_DELETING', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
    });
    file.trash();

    await this.repository.delete(file);

    await this.eventBus.publish(file.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_DELETED', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      size: file.size,
    });
  }
}
