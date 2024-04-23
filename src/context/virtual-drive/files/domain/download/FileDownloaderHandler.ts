import { Readable } from 'stream';
import { File, FileAttributes } from '../File';

export type FileDownloadEvents = {
  start: () => void;
  progress: (progress: number, elapsedTime: number) => void;
  finish: (fileId: FileAttributes['contentsId']) => void;
  error: (error: Error) => void;
};

export interface FileDownloaderHandler {
  download(file: File): Promise<Readable>;

  forceStop(): void;

  on(
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ): void;

  elapsedTime(): number;
}
