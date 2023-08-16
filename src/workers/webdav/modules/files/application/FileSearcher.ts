import { FileRepository } from '../domain/FileRepository';
import { File } from '../domain/File';
import { HttpFileRepository } from '../infrastructure/persistance/HttpFileRepository';

export class FileSearcher {
  constructor(private readonly repository: FileRepository) {}

  run(): Array<File> {
    // TODO: avoid the cast
    const repository = this.repository as HttpFileRepository;

    return Object.values(repository.files);
  }
}
