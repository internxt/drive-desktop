import { Service } from 'diod';
import { LocalFileRepository } from '../../domain/LocalFileRepository';
import { LocalFileCache } from '../../domain/LocalFileCache';
import { LocalFileId } from '../../domain/LocalFileId';

@Service()
export class LocalFileDeleter {
  constructor(
    private readonly repository: LocalFileRepository,
    private readonly cache: LocalFileCache
  ) {}

  async run(id: string) {
    const localFileId = new LocalFileId(id);

    const exists = await this.repository.exists(localFileId);

    if (exists) {
      await this.repository.delete(localFileId);
    }

    const isCached = await this.cache.has(localFileId);

    if (isCached) {
      this.cache.delete(localFileId);
    }
  }
}
