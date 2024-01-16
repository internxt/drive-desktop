import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { FolderFinder } from '../FolderFinder';
import { FolderRepository } from '../../domain/FolderRepository';
import { FolderId } from '../../domain/FolderId';

export class OfflineFolderCreator {
  constructor(
    private readonly folderFinder: FolderFinder,
    private readonly offlineRepository: OfflineFolderRepository,
    private readonly repository: FolderRepository
  ) {}

  run(posixRelativePath: string): OfflineFolder {
    const folderPath = new FolderPath(posixRelativePath);

    const onlineFolder = this.repository.searchByPartial({
      path: folderPath.value,
    });

    if (onlineFolder) {
      throw new Error('The folder already exists on remote');
    }

    const parent = this.folderFinder.run(folderPath.dirname());

    const parentId = new FolderId(parent.id);

    const folder = OfflineFolder.create(folderPath, parentId);

    this.offlineRepository.update(folder);

    return folder;
  }
}
