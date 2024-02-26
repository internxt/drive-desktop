import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';

export class SingleFileMatchingFinder {
  constructor(private readonly repository: FileRepository) {}

  async run(partial: Partial<FileAttributes>): Promise<File> {
    const files = this.repository.matchingPartial(partial);

    if (!files) {
      throw new FileNotFoundError('unknown');
    }

    if (files.length > 1) {
      throw new Error('Expected to find a singular file');
    }

    return files[0];
  }
}
