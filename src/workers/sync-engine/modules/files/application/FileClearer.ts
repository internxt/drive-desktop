import { FileRepository } from '../domain/FileRepository';

/** @deprecated */
export class FileClearer {
  constructor(private readonly repository: FileRepository) {}

  run(): void {
    return this.repository.clear();
  }
}
