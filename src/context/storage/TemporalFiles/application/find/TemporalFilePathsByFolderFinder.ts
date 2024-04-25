import { Service } from 'diod';
import { dirname } from 'path';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFilePath } from '../../domain/TemporalFilePath';

@Service()
export class TemporalFilePathsByFolderFinder {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(path: string): Promise<Array<TemporalFilePath>> {
    return this.repository.matchingDirectory(dirname(path));
  }
}
