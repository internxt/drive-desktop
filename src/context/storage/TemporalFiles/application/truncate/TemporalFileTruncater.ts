import { Service } from 'diod';
import { TemporalFilePath } from '../../domain/TemporalFilePath';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFileIOError } from '../../domain/errors/TemporalFileIOError';

@Service()
export class TemporalFileTruncater {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(path: string, size: number): Promise<void> {
    const documentPath = new TemporalFilePath(path);

    try {
      await this.repository.truncate(documentPath, size);
    } catch {
      throw new TemporalFileIOError();
    }
  }
}
