import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { ParentFolderFinder } from '../ParentFolderFinder';
import { FolderRepository } from '../../domain/FolderRepository';
import { FolderId } from '../../domain/FolderId';

export class OfflineFolderCreator {
  constructor(
    private readonly parentFolderFinder: ParentFolderFinder,
    private readonly offlineRepository: OfflineFolderRepository,
    private readonly repository: FolderRepository
  ) {}

  async run(posixRelativePath: string): Promise<OfflineFolder> {
    const folderPath = new FolderPath(posixRelativePath);

    const onlineFolder = this.repository.matchingPartial({
      path: folderPath.value,
    });

    if (onlineFolder) {
      throw new Error('The folder already exists on remote');
    }

    const parent = await this.parentFolderFinder.run(folderPath);

    const parentId = new FolderId(parent.id);

    const folder = OfflineFolder.create(folderPath, parentId);

    this.offlineRepository.update(folder);

    return folder;
  }
}
