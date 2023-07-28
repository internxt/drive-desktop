import { Readable } from 'stream';
import { RemoteFileContentsManagersFactory } from '../../domain/RemoteFileContentsManagersFactory';
import { FileSize } from '../../domain/FileSize';
import { WebdavFile } from '../../domain/WebdavFile';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';
import { ContentFileClonnerMock } from './ContentFileClonnerMock';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';

export class RemoteFileContentsManagersFactoryMock
  implements RemoteFileContentsManagersFactory
{
  public mockClone = new ContentFileClonnerMock();
  public mockDownload = new ContentFileDownloaderMock();
  public mockUpload = new ContentFileUploaderMock();

  clonner(_file: WebdavFile): ContentFileClonner {
    return this.mockClone;
  }

  downloader(): ContentFileDownloader {
    return this.mockDownload;
  }

  uploader(_size: FileSize): ContentFileUploader {
    return this.mockUpload;
  }
}
