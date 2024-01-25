import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class OfflineFileSizeIncreaser {
  constructor(private readonly repository: OfflineFileRepository) {}

  async run(id: string, amount: number): Promise<void> {
    const file = await this.repository.searchByPartial({ id });

    if (!file) {
      throw new Error('Offline file not found');
    }

    file.increaseSizeBy(amount);

    await this.repository.save(file);
  }
}
