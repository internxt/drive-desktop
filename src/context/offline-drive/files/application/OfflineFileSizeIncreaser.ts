import { Service } from 'diod';
import { OfflineFileId } from '../domain/OfflineFileId';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

@Service()
export class OfflineFileSizeIncreaser {
  constructor(private readonly repository: OfflineFileRepository) {}

  async run(id: OfflineFileId, amount: number): Promise<void> {
    const file = await this.repository.searchByPartial({ id: id.value });

    if (!file) {
      throw new Error('Offline file not found');
    }

    file.increaseSizeBy(amount);

    await this.repository.save(file);
  }
}
