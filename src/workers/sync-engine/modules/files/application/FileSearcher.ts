import { FileRepository } from '../domain/FileRepository';
import { File } from '../domain/File';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class FileSearcher {
  constructor(private readonly repository: FileRepository) {}

  async run(): Promise<Array<File>> {
    // TODO: avoid the cast
    const repository = this.repository as InMemoryFileRepository;

    // await repository.init();

    return Object.values(repository.filesAttributes);
  }
}
