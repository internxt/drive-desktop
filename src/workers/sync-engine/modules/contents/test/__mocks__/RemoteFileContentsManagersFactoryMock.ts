import { ContentsManagersFactory } from '../../domain/ContentsManagersFactory';
import { ContentFileUploader } from '../../domain/contentHandlers/ContentFileUploader';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileDownloader } from '../../domain/contentHandlers/ContentFileDownloader';
import { LocalFileContents } from '../../domain/LocalFileContents';

export class RemoteFileContentsManagersFactoryMock
  implements ContentsManagersFactory
{
  public mockDownloader = new ContentFileDownloaderMock();
  public mockUpload = new ContentFileUploaderMock();

  downloader(): ContentFileDownloader {
    return this.mockDownloader;
  }

  uploader(
    _contents: LocalFileContents,
    _abortSignal?: AbortSignal | undefined
  ): ContentFileUploader {
    return this.mockUpload;
  }
}
