import { Readable } from 'stream';
import { RemoteFileContentsManagersFactory } from '../../../contents/domain/RemoteFileContentsManagersFactory';
import { FileSize } from '../../domain/FileSize';
import { File } from '../../domain/File';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { ContentFileClonner } from '../../../contents/domain/ContentFileClonner';
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

  clonner(_file: File): ContentFileClonner {
    return this.mockClone;
  }

  downloader(): ContentFileDownloader {
    return this.mockDownload;
  }

  uploader(_size: FileSize): ContentFileUploader {
    return this.mockUpload;
  }
}
