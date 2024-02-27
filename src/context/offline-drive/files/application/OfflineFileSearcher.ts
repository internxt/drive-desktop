import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class OfflineFileSearcher {
  constructor(private readonly repository: OfflineFileRepository) {}

  async run(
    partial: Partial<OfflineFileAttributes>
  ): Promise<OfflineFile | undefined> {
    return await this.repository.searchByPartial(partial);
  }
}
