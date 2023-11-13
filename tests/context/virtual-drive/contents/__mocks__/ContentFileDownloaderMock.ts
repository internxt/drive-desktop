import { Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../../../../src/context/virtual-drive/contents/domain/contentHandlers/ContentFileDownloader';

export class ContentFileDownloaderMock implements ContentFileDownloader {
  mock = jest.fn();
  onMock = jest.fn();
  elapsedTimeMock = jest.fn();

  download(): Promise<Readable> {
    return this.mock();
  }

  forceStop(): void {
    return;
  }

  on(
    event: keyof FileDownloadEvents,
    fn:
      | (() => void)
      | ((progress: number) => void)
      | ((fileId: string) => void)
      | ((error: Error) => void)
  ): void {
    return this.onMock(event, fn);
  }

  elapsedTime(): number {
    return this.elapsedTimeMock();
  }
}
