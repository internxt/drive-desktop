import { FileMetadataCollection } from '../../files/domain/FileMetadataCollection';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
export class WebdavFolderRenamer {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly inMemoryItems: FileMetadataCollection
  ) {}

  async run(folder: WebdavFolder, destination: string) {
    const path = new FolderPath(destination);
    try {
      this.inMemoryItems.remove(folder.path.value);

      folder.rename(path);

      this.inMemoryItems.add(
        path.value,
        ItemMetadata.extractFromFolder(folder)
      );

      await this.repository.updateName(folder);
      await this.repository.runRemoteSync();
    } catch (error) {
      this.inMemoryItems.remove(path.value);
      throw error;
    }
  }
}
