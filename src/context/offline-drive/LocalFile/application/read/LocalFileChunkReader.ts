import { Service } from 'diod';
import { Optional } from '../../../../../shared/types/Optional';
import { LocalFileId } from '../../domain/LocalFileId';
import { LocalFileRepository } from '../../domain/LocalFileRepository';
import { LocalFileCache } from '../../domain/LocalFileCache';

@Service()
export class LocalFileChunkReader {
  constructor(
    private readonly cache: LocalFileCache,
    private readonly repository: LocalFileRepository
  ) {}

  private async obtainData(id: LocalFileId): Promise<Buffer> {
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
    const localFileId = new LocalFileId(id);

    const data = await this.obtainData(localFileId);

    if (position >= data.length) {
      return Optional.empty();
    }

    const chunk = data.slice(position, position + length);

    return Optional.of(chunk);
  }
}
