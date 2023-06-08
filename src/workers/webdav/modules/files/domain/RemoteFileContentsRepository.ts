import { Readable } from 'stream';
import { FileSize } from './FileSize';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsRepository {
  clone(file: WebdavFile): Promise<WebdavFile['fileId']>;

  download(file: WebdavFile): Promise<Readable>;

  upload(size: FileSize, contents: Readable): Promise<WebdavFile['fileId']>;
}
