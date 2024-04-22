import { Service } from 'diod';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

@Service()
export class OfflineFileDeleter {
  constructor(private readonly repository: OfflineFileRepository) {}

  async run(path: string): Promise<void> {
    const file = await this.repository.searchByPartial({ path });

    if (!file) {
      return;
    }

    await this.repository.delete(file.id);
  }
}
