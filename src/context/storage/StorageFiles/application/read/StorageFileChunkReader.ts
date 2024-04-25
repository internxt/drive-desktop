import { Service } from 'diod';
import { Optional } from '../../../../../shared/types/Optional';
import { StorageFileId } from '../../domain/StorageFileId';
import { StorageFileRepository } from '../../domain/StorageFileRepository';
import { StorageFileCache } from '../../domain/StorageFileCache';

@Service()
export class StorageFileChunkReader {
  constructor(
    private readonly cache: StorageFileCache,
    private readonly repository: StorageFileRepository
  ) {}

  private async obtainData(id: StorageFileId): Promise<Buffer> {
    const isCached = await this.cache.has(id);

    if (isCached) {
      return this.cache.read(id);
    }

    const buffer = await this.repository.read(id);

    await this.cache.store(id, buffer);

    return buffer;
  }

  async run(
    id: string,
    length: number,
    position: number
  ): Promise<Optional<Buffer>> {
    const storageId = new StorageFileId(id);

    const data = await this.obtainData(storageId);

    if (position >= data.length) {
      return Optional.empty();
    }

    const chunk = data.slice(position, position + length);

    return Optional.of(chunk);
  }
}
