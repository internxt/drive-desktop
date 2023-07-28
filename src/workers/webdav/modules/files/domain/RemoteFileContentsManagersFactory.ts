import { ContentFileClonner } from './ContentFileClonner';
import { ContentFileDownloader } from './ContentFileDownloader';
import { ContentFileUploader } from './ContentFileUploader';
import { FileSize } from './FileSize';
import { WebdavFile } from './WebdavFile';

export interface RemoteFileContentsManagersFactory {
  downloader(): ContentFileDownloader;

  uploader(size: FileSize): ContentFileUploader;

  clonner(file: WebdavFile): ContentFileClonner;
}
