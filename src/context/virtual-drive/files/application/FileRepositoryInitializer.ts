import { Service } from 'diod';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

@Service()
export class FileRepositoryInitializer {
  constructor(private readonly repository: FileRepository) {}

  async run(files: Array<File>): Promise<void> {
    const addPromises = files.map((file: File) => this.repository.add(file));

    await Promise.all(addPromises);
  }
}
