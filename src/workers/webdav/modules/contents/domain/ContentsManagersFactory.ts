import { ContentFileCloner } from './contentHandlers/ContentFileCloner';
import { ContentFileDownloader } from './contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from './contentHandlers/ContentFileUploader';
import { File } from '../../files/domain/File';
import { LocalFileContents } from './LocalFileContents';

export interface ContentsManagersFactory {
  downloader(): ContentFileDownloader;

  uploader(
    contents: LocalFileContents,
    abortSignal?: AbortSignal
  ): ContentFileUploader;

  cloner(file: File): ContentFileCloner;
}
