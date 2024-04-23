import { Service } from 'diod';
import { LocalFileCache } from '../../domain/LocalFileCache';
import { LocalFileRepository } from '../../domain/LocalFileRepository';

@Service()
export class ClearLocalFiles {
  constructor(
    private readonly cache: LocalFileCache,
    private readonly repo: LocalFileRepository
  ) {}

  async run(): Promise<void> {
    await this.cache.clear();

    await this.repo.deleteAll();
  }
}
