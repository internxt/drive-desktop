import Logger from 'electron-log';
import { EventRepository } from '../../shared/domain/EventRepository';
import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { FolderMover } from './FolderMover';
import { FolderRenamer } from './FolderRenamer';
import { FolderMovedDomainEvent } from '../domain/events/FolderMovedDomainEvent';

export class FolderPathUpdater {
  constructor(
    private readonly repository: FolderRepository,
    private readonly folderMover: FolderMover,
    private readonly folderRenamer: FolderRenamer,
    private readonly eventHistory: EventRepository
  ) {}

  async run(uuid: Folder['uuid'], posixRelativePath: string) {
    const folder = this.repository.searchByPartial({ uuid });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    const desiredPath = new FolderPath(posixRelativePath);

    Logger.debug('desired path', desiredPath);
    Logger.debug('folder', folder.attributes());

    const dirnameChanged = folder.dirname !== desiredPath.dirname();
    const nameChanged = folder.name !== desiredPath.name();

    if (dirnameChanged && nameChanged) {
      throw new ActionNotPermittedError('Move and rename (at the same time)');
    }

    if (dirnameChanged) {
      return await this.folderMover.run(folder, desiredPath);
    }

    if (nameChanged) {
      Logger.debug('about to rename');
      return await this.folderRenamer.run(folder, desiredPath);
    }

    const folderEvents = await this.eventHistory.search(folder.uuid);

    const folderMovedEvent = folderEvents.find((event) => {
      if (!(event instanceof FolderMovedDomainEvent)) {
        return false;
      }

      const { resultPath } = event.toPrimitives();

      if (resultPath !== desiredPath.value) {
        return false;
      }

      return true;
    });

    if (!folderMovedEvent) {
      // When a folder with content is moved the update path its called twice
      // it the folder has been moved there then ignore it
      throw new Error('No path change detected for folder path update');
    }
  }
}
