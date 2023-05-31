import { Readable } from 'stream';
import { WebdavFile } from '../WebdavFile';

export interface FileContentRepository {
  clone(file: WebdavFile): Promise<WebdavFile['fileId']>;

  download(fileId: WebdavFile['fileId']): Promise<Readable>;

  upload(size: number, contents: Readable): Promise<WebdavFile['fileId']>;
}
