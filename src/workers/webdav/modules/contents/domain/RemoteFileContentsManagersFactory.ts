import { ContentFileClonner } from './ContentFileClonner';
import { ContentFileDownloader } from './ContentFileDownloader';
import { ContentFileUploader } from './ContentFileUploader';
import { FileSize } from '../../files/domain/FileSize';
import { File } from '../../files/domain/File';

export interface RemoteFileContentsManagersFactory {
  downloader(): ContentFileDownloader;

  uploader(size: FileSize): ContentFileUploader;

  clonner(file: File): ContentFileClonner;
}
