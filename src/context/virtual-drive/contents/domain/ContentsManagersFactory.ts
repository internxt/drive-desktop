import { ContentFileDownloader } from './contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from './contentHandlers/ContentFileUploader';
import { LocalFileContents } from './LocalFileContents';

export interface ContentsManagersFactory {
  downloader(): ContentFileDownloader;

  uploader(
    contents: LocalFileContents,
    abortSignal?: AbortSignal
  ): ContentFileUploader;
}
