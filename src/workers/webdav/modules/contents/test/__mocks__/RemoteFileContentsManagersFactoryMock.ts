import { ContentsManagersFactory } from '../../domain/ContentsManagersFactory';
import { FileSize } from '../../../files/domain/FileSize';
import { File } from '../../../files/domain/File';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';
import { ContentFileClonnerMock } from './ContentFileClonnerMock';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { Contents } from '../../domain/Contents';

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
    _contents: Contents,
    _abortSignal?: AbortSignal | undefined
  ): ContentFileUploader {
    return this.mockUpload;
  }
}
