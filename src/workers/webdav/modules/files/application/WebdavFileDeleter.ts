import { WebdavIpc } from '../../../ipc';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { InMemoryTemporalFileMetadataCollection } from '../infrastructure/persistance/InMemoryTemporalFileMetadataCollection';

export class WebdavFileDeleter {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc,
    private readonly inMemoryItems: InMemoryTemporalFileMetadataCollection
  ) {}

  async run(file: WebdavFile): Promise<void> {
    try {
      this.inMemoryItems.add(
        file.path.value,
        ItemMetadata.extractFromFile(file)
      );
      file.trash();
      this.inMemoryItems.update(file.path.value, {
        visible: false,
      });
      await this.repository.delete(file);

      await this.eventBus.publish(file.pullDomainEvents());

      this.ipc.send('WEBDAV_FILE_DELETED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        size: file.size,
      });
    } catch (error) {
      this.inMemoryItems.remove(file.path.value);
      throw error;
    }
  }
}
