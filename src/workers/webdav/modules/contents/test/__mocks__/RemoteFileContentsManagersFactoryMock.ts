import { ContentsManagersFactory } from '../../domain/ContentsManagersFactory';
import { File } from '../../../files/domain/File';
import { ContentFileUploader } from '../../domain/contentHandlers/ContentFileUploader';
import { ContentFileClonner } from '../../domain/contentHandlers/ContentFileClonner';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';
import { ContentFileClonnerMock } from './ContentFileClonnerMock';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileDownloader } from '../../domain/contentHandlers/ContentFileDownloader';
import { LocalFileContents } from '../../domain/LocalFileContents';

export class RemoteFileContentsManagersFactoryMock
  implements ContentsManagersFactory
{
  public mockClone = new ContentFileClonnerMock();
  public mockDownload = new ContentFileDownloaderMock();
  public mockUpload = new ContentFileUploaderMock();

  clonner(_file: File): ContentFileClonner {
    return this.mockClone;
  }

  downloader(): ContentFileDownloader {
    return this.mockDownload;
  }

  uploader(
    _contents: LocalFileContents,
    _abortSignal?: AbortSignal | undefined
  ): ContentFileUploader {
    return this.mockUpload;
  }
}
