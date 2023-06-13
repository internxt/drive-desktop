import { Readable } from 'stream';
import { ContentFileUploader } from './ContentFileUploader';
import { FileSize } from './FileSize';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsRepository {
  clonner(file: WebdavFile): ContentFileUploader;

  download(file: WebdavFile): Promise<Readable>;

  uploader(size: FileSize, contents: Readable): ContentFileUploader;
}
