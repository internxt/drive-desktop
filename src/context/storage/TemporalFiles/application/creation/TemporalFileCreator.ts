import { Service } from 'diod';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFilePath } from '../../domain/TemporalFilePath';

@Service()
export class TemporalFileCreator {
  constructor(private repository: TemporalFileRepository) {}

  async run(path: string): Promise<void> {
    const documentPath = new TemporalFilePath(path);

    this.repository.create(documentPath);
  }
}
