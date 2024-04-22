import { Service } from 'diod';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

@Service()
export class RetrieveAllFiles {
  constructor(private readonly repository: FileRepository) {}

  run(): Promise<Array<File>> {
    return this.repository.all();
  }
}
