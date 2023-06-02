import { Readable } from 'stream';
import { FileContentRepository } from '../domain/storage/FileContentRepository';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileDownloader {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly contents: FileContentRepository
  ) {}

  async run(path: string): Promise<Readable> {
    const file = this.repository.search(path);

    if (!file) {
      throw new Error('File not found');
    }

    return this.contents.download(file.fileId);
  }
}
