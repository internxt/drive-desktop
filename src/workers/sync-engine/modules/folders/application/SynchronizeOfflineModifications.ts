import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { OfflineFolderRepository } from '../domain/OfflineFolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { FolderRenamedDomainEvent } from '../domain/events/FolderRenamedDomainEvent';
import { FolderRenamer } from './FolderRenamer';
import Logger from 'electron-log';

export class SynchronizeOfflineModifications {
  constructor(
    private readonly offlineRepository: OfflineFolderRepository,
    private readonly repository: FolderRepository,
    private readonly renamer: FolderRenamer
  ) {}

  async run(uuid: Folder['uuid']) {
    Logger.debug('Synchronize potential offline changes for folder: ', uuid);

    const offlineFolder = this.offlineRepository.getByUuid(uuid);

    if (!offlineFolder) {
      Logger.debug(`There is no offline folder with ${uuid}`);
      return;
    }

    const events = offlineFolder.pullDomainEvents();

    for (const event of events) {
      if (event.eventName !== FolderRenamedDomainEvent.EVENT_NAME) {
        continue;
      }

      const rename = event as FolderRenamedDomainEvent;

      const folder = this.repository.searchByPartial({ uuid });

      if (!folder) {
        throw new FolderNotFoundError(uuid);
      }

      if (rename.previousPath !== folder.path.value) {
        continue;
      }

      try {
        Logger.debug('Updating the folder with path: ', offlineFolder.path);
        await this.renamer.run(folder, offlineFolder.path);
        Logger.debug('Folder updated with the path: ', offlineFolder.path);
      } catch (error: unknown) {
        Logger.error(error);
      }
    }

    this.offlineRepository.remove(offlineFolder);
  }
}
