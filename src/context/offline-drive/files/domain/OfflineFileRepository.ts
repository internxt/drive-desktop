import { OfflineFile, OfflineFileAttributes } from './OfflineFile';

export interface OfflineFileRepository {
  save(file: OfflineFile): Promise<void>;

  searchByPartial(
    partial: Partial<OfflineFileAttributes>
  ): Promise<OfflineFile | undefined>;

  delete(id: OfflineFile['id']): Promise<void>;
}
