import { Readable } from 'stream';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { FileSize } from '../../domain/FileSize';
import { WebdavFile } from '../../domain/WebdavFile';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/ContentFileUploader';

class EnvironmentContentFileUpoaderMock implements ContentFileUploader {
  uploadMock = jest.fn();
  onMock = jest.fn();

  upload(): Promise<string> {
    return this.uploadMock();
  }
  on(
    event: keyof FileUploadEvents,
    fn:
      | (() => void)
      | ((progress: number) => void)
      | ((fileId: string) => void)
      | ((error: Error) => void)
  ): void {
    return this.onMock(event, fn);
  }
}

export class FileContentRepositoryMock implements RemoteFileContentsRepository {
  public mockClone = new EnvironmentContentFileUpoaderMock();
  public mockDownload = jest.fn();
  public mockUpload = new EnvironmentContentFileUpoaderMock();

  clonner(file: WebdavFile): ContentFileUploader {
    return this.mockClone;
  }

  downloader(file: WebdavFile): Promise<Readable> {
    return this.mockDownload(file);
  }

  uploader(size: FileSize, contents: Readable): ContentFileUploader {
    return this.mockUpload;
  }
}
