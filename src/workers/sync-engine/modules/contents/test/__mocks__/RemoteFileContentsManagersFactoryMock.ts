import { ContentsManagersFactory } from '../../domain/ContentsManagersFactory';
import { File } from '../../../files/domain/File';
import { ContentFileUploader } from '../../domain/contentHandlers/ContentFileUploader';
import { ContentFileCloner } from '../../domain/contentHandlers/ContentFileCloner';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';
import { ContentFileClonerMock } from './ContentFileClonerMock';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileDownloader } from '../../domain/contentHandlers/ContentFileDownloader';
import { LocalFileContents } from '../../domain/LocalFileContents';

export class RemoteFileContentsManagersFactoryMock
  implements ContentsManagersFactory
{
  public mockClone = new ContentFileClonerMock();
  public mockDownloader = new ContentFileDownloaderMock();
  public mockUpload = new ContentFileUploaderMock();

  cloner(_file: File): ContentFileCloner {
    return this.mockClone;
  }

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
