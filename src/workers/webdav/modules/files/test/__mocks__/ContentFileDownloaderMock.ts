import { Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/ContentFileDownloader';

export class ContentFileDownloaderMock implements ContentFileDownloader {
  mock = jest.fn();
  onMock = jest.fn();

  download(): Promise<Readable> {
    return this.mock();
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
}
