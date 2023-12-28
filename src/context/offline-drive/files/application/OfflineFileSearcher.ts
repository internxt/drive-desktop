import { OfflineFile } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class OfflineFileSearcher {
  constructor(private readonly repository: OfflineFileRepository) {}

  async execute(path: string): Promise<OfflineFile | undefined> {
    return await this.repository.searchByPartial({ path });
  }
}
