import { ContentsRepository } from '../domain/ContentsRepository';

export class OfflineContentsCacheCleaner {
  constructor(private readonly repository: ContentsRepository) {}

  run(contentsPath: string): Promise<void> {
    return this.repository.forget(contentsPath);
  }
}
