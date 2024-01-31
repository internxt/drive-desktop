import { OfflineFileId } from '../../files/domain/OfflineFileId';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';

export class OfflineContentsCreator {
  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(name: OfflineFileId): Promise<void> {
    await this.repository.createEmptyFile(name);
  }
}
