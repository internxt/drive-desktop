import { Readable } from 'stream';
import { File, FileAttributes } from '../../../files/domain/File';

export type FileDownloadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: FileAttributes['uuid']) => void;
  error: (error: Error) => void;
};

export interface ContentFileDownloader {
  download(file: File): Promise<Readable>;

  forceStop(): void;

  on(event: keyof FileDownloadEvents, handler: FileDownloadEvents[keyof FileDownloadEvents]): void;

  elapsedTime(): number;

  removeListeners(): void;
}
