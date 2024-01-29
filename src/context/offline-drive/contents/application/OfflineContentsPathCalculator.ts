import { OfflineFileId } from '../../files/domain/OfflineFileId';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';

export class OfflineContentsPathCalculator {
  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(id: OfflineFileId): Promise<string> {
    return this.repository.getAbsolutePath(id);
  }
}
