import { FilePath } from '../domain/FilePath';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileExists {
  constructor(private readonly repository: WebdavFileRepository) {}

  run(path: FilePath): boolean {
    return this.repository.search(path.value) !== undefined;
  }
}
