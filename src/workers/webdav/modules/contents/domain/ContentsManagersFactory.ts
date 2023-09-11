import { ContentFileClonner } from './contentHandlers/ContentFileClonner';
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

  clonner(file: File): ContentFileClonner;
}
