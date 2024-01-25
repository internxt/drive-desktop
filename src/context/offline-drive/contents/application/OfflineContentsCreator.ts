import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';

export class OfflineContentsCreator {
  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(name: string): Promise<void> {
    await this.repository.createEmptyFile(name);
  }
}
