import { Readable } from 'stream';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { FileSize } from '../../domain/FileSize';
import { WebdavFile } from '../../domain/WebdavFile';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { ContentFileUploaderMock } from './ContentFileUploaderMock';
import { ContentFileClonnerMock } from './ContentFileClonnerMock';
import { ContentFileDownloaderMock } from './ContentFileDownloaderMock';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';

export class FileContentRepositoryMock implements RemoteFileContentsRepository {
  public mockClone = new ContentFileClonnerMock();
  public mockDownload = new ContentFileDownloaderMock();
  public mockUpload = new ContentFileUploaderMock();

  clonner(_file: WebdavFile): ContentFileClonner {
    return this.mockClone;
  }

  downloader(_file: WebdavFile): ContentFileDownloader {
    return this.mockDownload;
  }

  uploader(_size: FileSize, _contents: Readable): ContentFileUploader {
    return this.mockUpload;
  }
}
