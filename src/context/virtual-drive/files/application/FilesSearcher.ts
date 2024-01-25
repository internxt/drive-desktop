import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class FilesSearcher {
  constructor(private readonly repository: FileRepository) {}

  async run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    const file = this.repository.searchByPartial(attributes);

    return file;
  }
}
