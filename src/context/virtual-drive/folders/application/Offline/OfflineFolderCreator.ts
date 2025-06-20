import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { FolderFinder } from '../FolderFinder';
import { FolderStatuses } from '../../domain/FolderStatus';
import { InMemoryFolderRepository } from '../../infrastructure/InMemoryFolderRepository';
import { logger } from '@/apps/shared/logger/logger';

export class OfflineFolderCreator {
  constructor(
    private readonly folderFinder: FolderFinder,
    private readonly repository: InMemoryFolderRepository,
  ) {}

  run(posixRelativePath: string): OfflineFolder {
    const folderPath = new FolderPath(posixRelativePath);

    const onlineFolder = this.repository.searchByPartial({
      path: folderPath.value,
      status: FolderStatuses.EXISTS,
    });

    if (onlineFolder) {
      throw new Error('The folder already exists on remote');
    }

    const parent = this.folderFinder.run(folderPath.dirname());

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Offline folder creator',
      posixRelativePath,
    });

    const folder = OfflineFolder.create(folderPath, parent.id, parent.uuid);

    return folder;
  }
}
