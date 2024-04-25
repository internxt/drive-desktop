import { Service } from 'diod';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFilePath } from '../../domain/TemporalFilePath';
import { TemporalFile } from '../../domain/TemporalFile';

@Service()
export class TemporalFileByPathFinder {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(path: string): Promise<TemporalFile | undefined> {
    const documentPath = new TemporalFilePath(path);

    const result = await this.repository.find(documentPath);

    if (result.isPresent()) {
      return result.get();
    }

    return undefined;
  }
}
