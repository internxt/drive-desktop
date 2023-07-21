import { FileMetadataCollection } from '../../files/domain/FileMetadataCollection';
import { ItemMetadata } from '../../shared/domain/ItemMetadata';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import { WebdavFolderFinder } from './WebdavFolderFinder';
import { WebdavFolderRenamer } from './WebdavFolderRenamer';

export class WebdavFolderMover {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly folderRenamer: WebdavFolderRenamer,
    private readonly inMemoryItems: FileMetadataCollection
  ) {}

  private async move(folder: WebdavFolder, parentFolder: WebdavFolder) {
    folder.moveTo(parentFolder);

    await this.repository.updateParentDir(folder);
  }

  async run(folder: WebdavFolder, to: string): Promise<void> {
    const destination = new FolderPath(to);
    try {
      const resultFolder = this.repository.search(destination.value);

      const shouldBeMerge = resultFolder !== undefined;

      if (shouldBeMerge) {
        throw new ActionNotPermitedError('overwrite');
      }

      const destinationFolder = this.folderFinder.run(destination.dirname());

      if (folder.isIn(destinationFolder)) {
        await this.folderRenamer.run(folder, to);
        await this.repository.runRemoteSync();
        return;
      }
      this.inMemoryItems.add(
        destination.value,
        ItemMetadata.from({
          createdAt: folder.createdAt.getTime(),
          updatedAt: folder.updatedAt.getTime(),
          name: folder.name,
          size: folder.size,
          extension: '',
          type: 'FOLDER',
          visible: true,
          lastPath: folder.path.value,
          externalMetadata: {
            parentId: destinationFolder.id,
            folderId: folder.id,
          },
        })
      );
      await this.move(folder, destinationFolder);
      await this.repository.runRemoteSync();
    } catch (error) {
      this.inMemoryItems.remove(destination.value);
      throw error;
    }
  }
}
