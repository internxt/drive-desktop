import { FolderRepository } from '../domain/FolderRepository';

export class FolderClearer {
  constructor(
    private readonly repository: FolderRepository
  ) {}

  run(): void {
    return this.repository.clear();
  }
}
