import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { OnlyOneFileExpectedError } from '../domain/errors/OnlyOneFileExpectedError';

export class SingleFileMatchingFinder {
  constructor(private readonly repository: FileRepository) {}

  /**
   * @param partial a partial object of the attributes of the file in search
   * @returns the matching file for the given partial attributes or undefined if no one matches
   * @throws an {@link OnlyOneFileExpectedError} when it finds more than one file
   * or a {@link FileNotFoundError} when no file is founded
   */
  async run(partial: Partial<FileAttributes>): Promise<File> {
    const files = this.repository.matchingPartial(partial);

    if (files.length === 0)
      throw new FileNotFoundError(JSON.stringify(partial));

    if (files.length > 1) throw new OnlyOneFileExpectedError();

    return files[0];
  }
}
