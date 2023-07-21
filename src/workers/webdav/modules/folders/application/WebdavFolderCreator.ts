import { InMemoryTemporalFileMetadataCollection } from '../../files/infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import { WebdavFolderFinder } from './WebdavFolderFinder';
import Logger from 'electron-log';
export class WebdavFolderCreator {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly inMemoryItems: InMemoryTemporalFileMetadataCollection
  ) {}

  async run(path: string): Promise<void> {
    const folderPath = new FolderPath(path);
    try {
      const parent = this.folderFinder.run(folderPath.dirname());

      this.inMemoryItems.add(
        folderPath.value,
        ItemMetadata.from({
          createdAt: Date.now(),
          updatedAt: Date.now(),
          name: folderPath.name(),
          size: 0,
          extension: '',
          type: 'FOLDER',
          visible: true,
          externalMetadata: {
            parentId: parent.id,
          },
        })
      );

      const folder = await this.repository.create(folderPath, parent.id);

      this.inMemoryItems.update(folderPath.value, {
        externalMetadata: {
          id: folder.id,
          parentId: folder.parentId,
        },
      });

      await this.repository.runRemoteSync();
    } catch (error) {
      Logger.error('Error creating folder: ', error);
      this.inMemoryItems.remove(folderPath.value);
      throw error;
    }
  }
}
