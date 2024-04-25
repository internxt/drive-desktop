import { Service } from 'diod';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFilePath } from '../../domain/TemporalFilePath';

@Service()
export class TemporalFileDeleter {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(path: string): Promise<void> {
    const documentPath = new TemporalFilePath(path);

    await this.repository.delete(documentPath);
  }
}
