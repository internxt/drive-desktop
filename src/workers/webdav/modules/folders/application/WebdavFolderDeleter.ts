import { FileMetadataCollection } from '../../files/domain/FileMetadataCollection';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';

export class WebdavFolderDeleter {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly inMemoryItems: FileMetadataCollection
  ) {}

  async run(folder: WebdavFolder): Promise<void> {
    try {
      this.inMemoryItems.add(
        folder.path.value,
        ItemMetadata.extractFromFolder(folder)
      );

      folder.trash();
      this.inMemoryItems.update(folder.path.value, {
        visible: false,
      });
      await this.repository.trash(folder);
      this.repository.runRemoteSync();
    } catch (error) {
      this.inMemoryItems.remove(folder.path.value);
      throw error;
    }
  }
}
