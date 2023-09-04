import { Readable } from 'stream';
import { ThumbnailAtributes } from './Thumbnail';

export type ThumbnailDownloadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (contentsId: ThumbnailAtributes['contentsId']) => void;
  error: (error: Error) => void;
};

export interface ThumbnailDownloader {
  downloadThumbnail(thumbnailContentsId: string): Promise<Readable>;

  on(
    event: keyof ThumbnailDownloadEvents,
    handler: ThumbnailDownloadEvents[keyof ThumbnailDownloadEvents]
  ): void;

  elapsedTime(): number;
}
