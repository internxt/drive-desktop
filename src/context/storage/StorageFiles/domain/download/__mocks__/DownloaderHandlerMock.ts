import { DownloaderHandler, DownloadEvents } from '../DownloaderHandler';
import { Readable } from 'stream';
import { StorageFile } from '../../StorageFile';
import { jest } from '@jest/globals';


export class DownloaderHandlerMock implements DownloaderHandler {
  download = jest.fn<Promise<Readable>, [StorageFile]>(() =>
    Promise.resolve(new Readable({
      read() {
        this.push(null);
      }
    }))
  );

  downloadById = jest.fn<Promise<Readable>, [string]>(() =>
    Promise.resolve(new Readable({
      read() {
        this.push(null);
      }
    }))
  );

  forceStop = jest.fn<void, []>();

  on = jest.fn<void, [keyof DownloadEvents, DownloadEvents[keyof DownloadEvents]]>();

  elapsedTime = jest.fn<number, []>(() => 1000);
}
