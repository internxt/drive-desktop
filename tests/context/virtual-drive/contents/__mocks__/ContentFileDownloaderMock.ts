import { Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';

export class ContentFileDownloaderMock implements ContentFileDownloader {
  downloadMock = jest.fn();
  onMock = jest.fn();
  elapsedTimeMock = jest.fn();

  download(): Promise<Readable> {
    return this.downloadMock();
  }

  forceStop(): void {
    return;
  }

  on(
    event: keyof FileDownloadEvents,
    fn: FileDownloadEvents[keyof FileDownloadEvents]
  ): void {
    return this.onMock(event, fn);
  }

  elapsedTime(): number {
    return this.elapsedTimeMock();
  }
}
