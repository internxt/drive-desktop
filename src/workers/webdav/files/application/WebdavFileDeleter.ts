import { FilePath } from '../domain/FilePath';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDeleter {
  constructor(private readonly repository: WebdavFileRepository) {}

  async run(path: FilePath): Promise<void> {
    const file = this.repository.search(path.value);

    if (!file) {
      throw new Error('[File deleter] File not found');
    }

    await this.repository.delete(file);
  }
}
