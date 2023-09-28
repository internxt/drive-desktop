import { File, FileAttributes } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class FileByPartialSearcher {
  constructor(private readonly repository: FileRepository) {}

  run(partial: Partial<FileAttributes>): File | undefined {
    return this.repository.searchByPartial(partial);
  }
}
