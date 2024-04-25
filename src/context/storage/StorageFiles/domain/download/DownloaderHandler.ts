import { Readable } from 'stream';
import { StorageFile } from '../StorageFile';

export type DownloadEvents = {
  start: () => void;
  progress: (progress: number, elapsedTime: number) => void;
  finish: (fileId: StorageFile['id']) => void;
  error: (error: Error) => void;
};

export interface DownloaderHandler {
  download(file: StorageFile): Promise<Readable>;

  forceStop(): void;

  on(
    event: keyof DownloadEvents,
    handler: DownloadEvents[keyof DownloadEvents]
  ): void;

  elapsedTime(): number;
}
