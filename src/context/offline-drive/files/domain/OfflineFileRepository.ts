import { OfflineFile, OfflineFileAttributes } from './OfflineFile';

export abstract class OfflineFileRepository {
  abstract save(file: OfflineFile): Promise<void>;

  abstract searchByPartial(
    partial: Partial<OfflineFileAttributes>
  ): Promise<OfflineFile | undefined>;

  abstract delete(id: OfflineFile['id']): Promise<void>;

  abstract all(): Promise<Array<OfflineFile>>;
}
