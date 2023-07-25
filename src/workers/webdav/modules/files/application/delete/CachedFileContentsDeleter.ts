import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';
import { WebdavFileAtributes } from '../../domain/WebdavFile';

export class CachedFileContentsDeleter {
  constructor(private readonly repository: LocalFileConentsRepository) {}

  run(fileId: WebdavFileAtributes['fileId']): Promise<void> {
    return this.repository.delete(fileId);
  }
}
