import { Service } from 'diod';
import { OfflineFile } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

@Service()
export class TemporalOfflineDeleter {
  constructor(private readonly repository: OfflineFileRepository) {}

  async run(file: OfflineFile): Promise<void> {
    return this.repository.delete(file.id);
  }
}
