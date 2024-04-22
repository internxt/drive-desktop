import { Service } from 'diod';
import { ContentFileDownloader } from './contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from './contentHandlers/ContentFileUploader';
import { LocalFileContents } from './LocalFileContents';

@Service()
export abstract class ContentsManagersFactory {
  abstract downloader(): ContentFileDownloader;

  abstract uploader(
    contents: LocalFileContents,
    abortSignal?: AbortSignal
  ): ContentFileUploader;
}
