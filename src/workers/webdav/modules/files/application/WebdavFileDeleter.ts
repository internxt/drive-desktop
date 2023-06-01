import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDeleter {
  constructor(private readonly repository: WebdavFileRepository) {}

  async run(file: WebdavFile): Promise<void> {
    await this.repository.delete(file);
  }
}
