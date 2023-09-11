import { FileRepository } from '../domain/FileRepository';
import { File } from '../domain/File';
import { HttpFileRepository } from '../infrastructure/HttpFileRepository';

export class FileSearcher {
  constructor(private readonly repository: FileRepository) {}

  async run(): Promise<Array<File>> {
    // TODO: avoid the cast
    const repository = this.repository as HttpFileRepository;

    // await repository.init();

    return Object.values(repository.files);
  }
}
