import { Service } from 'diod';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';

@Service()
export class OfflineContentsCacheCleaner {
  constructor(private readonly repository: OfflineContentsRepository) {}

  run(contentsPath: string): Promise<void> {
    return this.repository.forget(contentsPath);
  }
}
