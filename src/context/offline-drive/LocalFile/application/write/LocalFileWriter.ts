import { Service } from 'diod';
import { Readable } from 'stream';
import { LocalFileId } from '../../domain/LocalFileId';
import { LocalFileRepository } from '../../domain/LocalFileRepository';

@Service()
export class LocalFileWriter {
  constructor(private readonly repository: LocalFileRepository) {}

  async run(id: string, readable: Readable): Promise<void> {
    const localFileId = new LocalFileId(id);

    await this.repository.store(localFileId, readable);
  }
}
