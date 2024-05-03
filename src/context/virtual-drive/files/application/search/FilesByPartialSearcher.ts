import { Service } from 'diod';
import { FileRepository } from '../../domain/FileRepository';
import { File, FileAttributes } from '../../domain/File';

@Service()
export class FilesByPartialSearcher {
  constructor(private readonly repository: FileRepository) {}

  async run(partial: Partial<FileAttributes>): Promise<Array<File>> {
    return this.repository.matchingPartial(partial);
  }
}
