import { Readable } from 'stream';
import { WebdavFileAtributes } from './WebdavFile';

export type FileDownloadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (fileId: WebdavFileAtributes['fileId']) => void;
  error: (error: Error) => void;
};

export interface ContentFileDownloader {
  download(): Promise<Readable>;

  on(
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ): void;

  elapsedTime(): number;
}
