import { ContentsManagersFactory } from '../../../../../src/context/virtual-drive/contents/domain/ContentsManagersFactory';
import { LocalFileContents } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileContents';
import { ContentFileDownloader } from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileUploader';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';

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
