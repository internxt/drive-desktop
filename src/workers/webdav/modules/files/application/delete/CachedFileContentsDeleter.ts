import { ContentsCacheRepository } from '../../domain/ContentsCacheRepository';
import { WebdavFileAtributes } from '../../domain/WebdavFile';

export class CachedFileContentsDeleter {
  constructor(private readonly repository: ContentsCacheRepository) {}

  run(fileId: WebdavFileAtributes['fileId']): Promise<void> {
    return this.repository.delete(fileId);
  }
}
