import { OfflineFolder } from '../domain/OfflineFolder';
import { OfflineFolderRepository } from '../domain/OfflineFolderRepository';
import Logger from 'electron-log';

export class InMemoryOfflineFolderRepository
  implements OfflineFolderRepository
{
  private foldersByUuid: Record<string, OfflineFolder> = {};

  getByUuid(uuid: string): OfflineFolder | undefined {
    return this.foldersByUuid[uuid];
  }

  update(folder: OfflineFolder): void {
    try {
      const storedFolder = this.foldersByUuid[folder.uuid] as
        | OfflineFolder
        | undefined;

      const storedEvents = storedFolder ? storedFolder.pullDomainEvents() : [];
      const newEvents = folder.pullDomainEvents();

      [...storedEvents, ...newEvents].forEach((event) => folder.record(event));

      this.foldersByUuid[folder.uuid] = folder;
    } catch (error: unknown) {
      Logger.error('ERROR UPDATING OFFLINE FOLDER', error);
    }
  }

  remove(folder: OfflineFolder): void {
    delete this.foldersByUuid[folder.uuid];
  }
}
