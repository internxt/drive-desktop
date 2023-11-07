import { File } from '../domain/File';
import { OldFileRepository } from '../domain/OldFileRepository';

export class RetrieveAllFiles {
  constructor(private readonly repository: OldFileRepository) {}

  run(): Promise<Array<File>> {
    return this.repository.all();
  }
}
