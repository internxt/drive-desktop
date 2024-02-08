import { OfflineFileAttributes } from '../../files/domain/OfflineFile';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';

export class OfflineContentsPathCalculator {
  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(id: OfflineFileAttributes['id']): Promise<string> {
    return this.repository.getAbsolutePath(id);
  }
}
