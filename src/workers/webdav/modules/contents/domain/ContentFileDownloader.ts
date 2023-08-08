import { Readable } from 'stream';
import { File, FileAtributes } from './File';

export type FileDownloadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: FileAtributes['fileId']) => void;
  error: (error: Error) => void;
};

export interface ContentFileDownloader {
  download(file: File): Promise<Readable>;

  on(
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ): void;

  elapsedTime(): number;
}
