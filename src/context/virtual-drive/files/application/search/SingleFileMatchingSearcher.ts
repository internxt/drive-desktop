import { Service } from 'diod';
import { File, FileAttributes } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import { OnlyOneFileExpectedError } from '../../domain/errors/OnlyOneFileExpectedError';

@Service()
export class SingleFileMatchingSearcher {
  constructor(private readonly repository: FileRepository) {}

  /**
   * @param partial a partial object of the attributes of the file in search
   * @returns the matching file for the given partial attributes or undefined if no one matches
   * @throws an {@link OnlyOneFileExpectedError} when it finds more than one file
   */
  async run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    const files = this.repository.matchingPartial(attributes);

    if (files.length > 1) throw new OnlyOneFileExpectedError();

    if (files.length === 0) return;

    return files[0];
  }
}
