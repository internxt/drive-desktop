import Logger from 'electron-log';
import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { FolderFinder } from '../FolderFinder';
import { FolderRepository } from '../../domain/FolderRepository';
import { FolderStatuses } from '../../domain/FolderStatus';

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
      status: FolderStatuses.EXISTS,
    });

    if (onlineFolder) {
      throw new Error('The folder already exists on remote');
    }

    const parent = this.folderFinder.run(folderPath.dirname());

    Logger.debug('[DEBUG IN OFFLINEFOLDERCREATOR STEEP 1]');

    Logger.debug(parent);

    const folder = OfflineFolder.create(folderPath, parent.id, parent.uuid);

    this.offlineRepository.update(folder);

    return folder;
  }
}
