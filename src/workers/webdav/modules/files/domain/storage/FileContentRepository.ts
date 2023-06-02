import { Readable } from 'stream';
import { FileSize } from '../FileSize';
import { WebdavFile } from '../WebdavFile';

export interface FileContentRepository {
  clone(file: WebdavFile): Promise<WebdavFile['fileId']>;

  download(fileId: WebdavFile['fileId']): Promise<Readable>;

  upload(size: FileSize, contents: Readable): Promise<WebdavFile['fileId']>;
}
