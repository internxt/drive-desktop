import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class SingleFileMatchingSearcher {
  constructor(private readonly repository: FileRepository) {}

  async run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    const files = this.repository.matchingPartial(attributes);

    if (!files) return;

    if (files.length > 1) {
      throw new Error('Expected to find a singular file');
    }

    return files[0];
  }
}
