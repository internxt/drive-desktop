import { File } from '../domain/File';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class RetrieveAllFiles {
  constructor(private readonly repository: InMemoryFileRepository) {}

  run(): Promise<Array<File>> {
    return this.repository.all();
  }
}
