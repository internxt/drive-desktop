import { Readable } from 'stream';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { FileSize } from '../../domain/FileSize';
import { WebdavFile } from '../../domain/WebdavFile';

export class FileContentRepositoryMock implements RemoteFileContentsRepository {
  public mockClone = jest.fn();
  public mockDownload = jest.fn();
  public mockUpload = jest.fn();

  clone(file: WebdavFile): Promise<string> {
    return this.mockClone(file);
  }

  download(file: WebdavFile): Promise<Readable> {
    return this.mockDownload(file);
  }

  upload(size: FileSize, contents: Readable): Promise<WebdavFile['fileId']> {
    return this.mockUpload(size, contents);
  }
}
