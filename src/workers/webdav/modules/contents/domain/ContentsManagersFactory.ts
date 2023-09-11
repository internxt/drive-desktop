import { ContentFileClonner } from './ContentFileClonner';
import { ContentFileDownloader } from './ContentFileDownloader';
import { ContentFileUploader } from './ContentFileUploader';
import { File } from '../../files/domain/File';
import { Contents } from './Contents';

export interface ContentsManagersFactory {
  downloader(): ContentFileDownloader;

  uploader(contents: Contents, abortSignal?: AbortSignal): ContentFileUploader;

  clonner(file: File): ContentFileClonner;
}
