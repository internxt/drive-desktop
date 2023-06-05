import { Readable } from 'stream';
import { RemoteFileContentsRepository } from '../../domain/FileContentRepository';
import { WebdavFile } from '../../domain/WebdavFile';

export class FileContentRepositoryMock implements RemoteFileContentsRepository {
  public mockClone = jest.fn();
  public mockDownload = jest.fn();
  public mockUpload = jest.fn();

  clone(file: WebdavFile): Promise<string> {
    return this.mockClone(file);
  }
  download(fileId: string): Promise<Readable> {
    return this.mockDownload(fileId);
  }
  upload(size: number, contents: Readable): Promise<string> {
    return this.mockUpload(size, contents);
  }
}
