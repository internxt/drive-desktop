import { Readable } from 'stream';
import { ContentFileDownloader } from './ContentFileDownloader';
import { ContentFileUploader } from './ContentFileUploader';
import { FileSize } from './FileSize';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsRepository {
  clonner(file: WebdavFile): ContentFileUploader;

  downloader(file: WebdavFile): ContentFileDownloader;

  uploader(size: FileSize, contents: Readable): ContentFileUploader;
}
