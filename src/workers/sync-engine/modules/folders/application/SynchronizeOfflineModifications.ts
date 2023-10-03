import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { OfflineFolderRepository } from '../domain/OfflineFolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { FolderRenamer } from './FolderRenamer';
import Logger from 'electron-log';

export class SynchronizeOfflineModifications {
  constructor(
    private readonly offlineRepository: OfflineFolderRepository,
    private readonly repository: FolderRepository,
    private readonly renamer: FolderRenamer
  ) {}

  async run(uuid: Folder['uuid']) {
    Logger.debug('Synchronize potential offline changes');
    const offlineFolder = this.offlineRepository.getByUuid(uuid);
    const folder = this.repository.searchByPartial({ uuid });

    if (!offlineFolder) {
      Logger.debug(`There is no offline folder with ${uuid}`);
      return;
    }

    if (!folder) {
      Logger.debug('There is no folder with ', uuid);
      throw new FolderNotFoundError(uuid);
    }

    if (offlineFolder.name === folder.name) {
      Logger.debug(
        'Offline and online folder have the same name: ',
        folder.name
      );
      return;
    }

    Logger.debug('Updating the folder with path: ', offlineFolder.path);
    await this.renamer.run(folder, offlineFolder.path);
    Logger.debug('Folder updated with the path: ', offlineFolder.path);
  }
}
