import { OfflineFolder, OfflineFolderAttributes } from './OfflineFolder';

export interface OfflineFolderRepository {
  searchByPartial(
    partial: Partial<OfflineFolderAttributes>
  ): OfflineFolder | undefined;
  update(folder: OfflineFolder): void;
  remove(folder: OfflineFolder): void;
}
