import { Service } from 'diod';
import { LocalFileCache } from '../../domain/LocalFileCache';
import { LocalFileId } from '../../domain/LocalFileId';

@Service()
export class LocalFileCacheDeleter {
  constructor(private readonly cache: LocalFileCache) {}

  async run(id: string): Promise<void> {
    const localFileId = new LocalFileId(id);

    await this.cache.delete(localFileId);
  }
}
