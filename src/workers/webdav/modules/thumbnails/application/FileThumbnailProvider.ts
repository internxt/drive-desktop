import { Readable } from 'stream';
import { File } from '../../files/domain/File';
import { ThumbnailDownloader } from '../domain/ThumbnailDownloader';

export class FileThumbnailProvider {
  constructor(private readonly downloader: ThumbnailDownloader) {}

  async run(file: File): Promise<Readable | undefined> {
    const id = file.thumbnailContentsId;

    if (!id) {
      return;
    }

    return this.downloader.downloadThumbnail(id);
  }
}
