import { DownloaderHandler, DownloadEvents } from '../DownloaderHandler';
import { Readable } from 'stream';
import { StorageFile } from '../../StorageFile';

export class DownloaderHandlerMock implements DownloaderHandler {
  download = vi.fn<(file: StorageFile) => Promise<Readable>>(() =>
    Promise.resolve(
      new Readable({
        read() {
          this.push(null);
        },
      }),
    ),
  );

  downloadById = vi.fn<(id: string) => Promise<Readable>>(() =>
    Promise.resolve(
      new Readable({
        read() {
          this.push(null);
        },
      }),
    ),
  );

  forceStop = vi.fn<() => void>();

  on = vi.fn<(event: keyof DownloadEvents, handler: DownloadEvents[keyof DownloadEvents]) => void>();

  elapsedTime = vi.fn<() => number>(() => 1000);
}
