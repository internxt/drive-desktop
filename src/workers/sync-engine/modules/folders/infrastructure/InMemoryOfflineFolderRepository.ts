import { OfflineFolder } from '../domain/OfflineFolder';
import { OfflineFolderRepository } from '../domain/OfflineFolderRepository';
import Logger from 'electron-log';

export class InMemoryOfflineFolderRepository
  implements OfflineFolderRepository
{
  private foldersByPath: Record<string, OfflineFolder> = {};
  private foldersByUuid: Record<string, OfflineFolder> = {};

  getByUuid(uuid: string): OfflineFolder | undefined {
    return this.foldersByUuid[uuid];
  }

  getByPath(path: string): OfflineFolder | undefined {
    return this.foldersByPath[path];
  }

  update(folder: OfflineFolder): void {
    try {
      const storedFolder = this.foldersByPath[folder.path.value] as
        | OfflineFolder
        | undefined;

      const storedEvents = storedFolder ? storedFolder.pullDomainEvents() : [];
      const newEvents = folder.pullDomainEvents();

      [...storedEvents, ...newEvents].forEach((event) => folder.record(event));

      this.foldersByPath[folder.path.value] = folder;
      this.foldersByUuid[folder.uuid] = folder;
    } catch (error: unknown) {
      Logger.error('ERROR UPDATING OFFLINE FOLDER', error);
    }
  }

  remove(folder: OfflineFolder): void {
    delete this.foldersByPath[folder.path.value];
    delete this.foldersByUuid[folder.uuid];
  }
}
