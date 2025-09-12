import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { EventRepository } from '../../shared/domain/EventRepository';
import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { OfflineFolderRepository } from '../domain/OfflineFolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { FolderRenamedDomainEvent } from '../domain/events/FolderRenamedDomainEvent';
import { FolderRenamer } from './FolderRenamer';

@Service()
export class SynchronizeOfflineModifications {
  constructor(
    private readonly offlineRepository: OfflineFolderRepository,
    private readonly repository: FolderRepository,
    private readonly renamer: FolderRenamer,
    private readonly eventsRepository: EventRepository
  ) {}

  async run(uuid: Folder['uuid']) {
    logger.debug({ msg: 'Synchronize potential offline changes for folder:', uuid });

    const offlineFolder = this.offlineRepository.searchByPartial({ uuid });

    if (!offlineFolder) {
      logger.debug({ msg: `There is no offline folder with ${uuid}` });
      return;
    }

    const events = await this.eventsRepository.search(uuid);

    for (const event of events) {
      if (event.eventName !== FolderRenamedDomainEvent.EVENT_NAME) {
        continue;
      }

      const rename = event as FolderRenamedDomainEvent;

      const folder = this.repository.matchingPartial({ uuid })[0];

      if (!folder) {
        throw new FolderNotFoundError(uuid);
      }

      if (rename.previousPath !== folder.path) {
        continue;
      }

      try {
        logger.debug({ msg: 'Updating the folder with path:', path: offlineFolder.path });
        await this.renamer.run(folder, new FolderPath(offlineFolder.path));
        logger.debug({ msg: 'Folder updated with the path:', path: offlineFolder.path });
      } catch (error: unknown) {
        logger.error({ msg: 'Error synchronizing offline folder modifications:', error });
      }
    }

    this.offlineRepository.remove(offlineFolder);
  }
}
