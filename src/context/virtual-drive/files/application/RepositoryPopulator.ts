import { File } from '../domain/File';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class RepositoryPopulator {
  constructor(private readonly repository: InMemoryFileRepository) {}

  async run(files: Array<File>): Promise<void> {
    const addPromises = files.map((file: File) => this.repository.add(file));

    await Promise.all(addPromises);
  }
}
