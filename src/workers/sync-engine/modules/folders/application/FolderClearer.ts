import { FolderRepository } from '../domain/FolderRepository';

/** @deprecated */
export class FolderClearer {
  constructor(private readonly repository: FolderRepository) {}

  run(): void {
    return this.repository.clear();
  }
}
