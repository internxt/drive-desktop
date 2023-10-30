import { FolderPath } from '../../domain/FolderPath';
import { FolderRepository } from '../../domain/FolderRepository';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { FolderFinder } from '../FolderFinder';

export class OfflineFolderCreator {
  constructor(
    private readonly folderFinder: FolderFinder,
    private readonly offlineRepository: OfflineFolderRepository,
    private readonly repository: FolderRepository
  ) {}

  async run(posixRelativePath: string): Promise<OfflineFolder> {
    const folderPath = new FolderPath(posixRelativePath);

    const onlineFolder = await this.repository.searchByPartial({
      path: folderPath.value,
    });

    if (onlineFolder) {
      throw new Error('The folder already exists on remote');
    }

    const parent = await this.folderFinder.run(folderPath.dirname());

    const folder = OfflineFolder.create(folderPath, parent.id);

    this.offlineRepository.update(folder);

    return folder;
  }
}
