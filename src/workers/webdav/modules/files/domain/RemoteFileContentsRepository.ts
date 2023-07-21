import { Readable } from 'stream';
import { ContentFileClonner } from './ContentFileClonner';
import { ContentFileDownloader } from './ContentFileDownloader';
import { ContentFileUploader } from './ContentFileUploader';
import { FileSize } from './FileSize';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsRepository {
  downloader(): ContentFileDownloader;

  uploader(size: FileSize, contents: Readable): ContentFileUploader;

  clonner(file: WebdavFile): ContentFileClonner;
}
