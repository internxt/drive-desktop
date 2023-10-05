import { OfflineFolder } from './OfflineFolder';

export interface OfflineFolderRepository {
  getByUuid(uuid: OfflineFolder['uuid']): OfflineFolder | undefined;
  getByPath(path: string): OfflineFolder | undefined;
  update(folder: OfflineFolder): void;
  remove(folder: OfflineFolder): void;
}
