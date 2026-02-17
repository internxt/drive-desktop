import { Readable } from 'stream';

export interface ThumbnailDownloader {
  download(id: string): Promise<Readable>;
}
