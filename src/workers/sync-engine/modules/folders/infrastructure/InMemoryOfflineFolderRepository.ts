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
    Logger.debug('OFFLINE FOLDER UPDATED:', folder.attributes());
    this.foldersByPath[folder.path.value] = folder;
    this.foldersByUuid[folder.uuid] = folder;
  }
}
