import { Service } from 'diod';
import { LocalFileRepository } from '../../domain/LocalFileRepository';
import { LocalFileId } from '../../domain/LocalFileId';

@Service()
export class LocalFileIsAvailable {
  constructor(private readonly repository: LocalFileRepository) {}

  async run(id: string) {
    const localFileId = new LocalFileId(id);

    return await this.repository.exists(localFileId);
  }
}
