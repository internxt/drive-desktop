import { Readable } from 'stream';
import { FileSize } from './FileSize';
import { RemoteFileContents } from './RemoteFileContent';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsRepository {
  clone(file: WebdavFile): Promise<WebdavFile['fileId']>;

  download(fileId: WebdavFile): Promise<RemoteFileContents>;

  upload(size: FileSize, contents: Readable): Promise<WebdavFile['fileId']>;
}
