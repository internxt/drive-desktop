import { Readable } from 'stream';
import { RemoteFileContentsRepository } from '../../domain/FileContentRepository';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContents } from '../../domain/RemoteFileContent';
import { WebdavFile } from '../../domain/WebdavFile';

export class FileContentRepositoryMock implements RemoteFileContentsRepository {
  public mockClone = jest.fn();
  public mockDownload = jest.fn();
  public mockUpload = jest.fn();

  clone(file: WebdavFile): Promise<string> {
    return this.mockClone(file);
  }

  download(file: WebdavFile): Promise<RemoteFileContents> {
    return this.mockDownload(file);
  }

  upload(size: FileSize, contents: Readable): Promise<WebdavFile['fileId']> {
    return this.mockUpload(size, contents);
  }
}
