import { ContentFileClonner } from './ContentFileClonner';
import { ContentFileDownloader } from './ContentFileDownloader';
import { ContentFileUploader } from './ContentFileUploader';
import { FileSize } from './FileSize';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsRepository {
  downloader(file: WebdavFile): ContentFileDownloader;

  uploader(size: FileSize): ContentFileUploader;

  clonner(file: WebdavFile): ContentFileClonner;
}
