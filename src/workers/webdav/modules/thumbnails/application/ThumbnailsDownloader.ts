import { ThumbnailDownloader } from '../domain/ThumbnailDownloader';
import { File } from '../../files/domain/File';
import { mapLimit } from 'async';
import fs from 'fs';
import path from 'path';

export class ThumbnailsDownloader {
  private static CONCURRENT_DOWNLOADS = 3;

  constructor(
    private readonly downloadFolder: string,
    private readonly downloader: ThumbnailDownloader
  ) {}

  async run(files: Array<File>): Promise<void> {
    mapLimit(
      files,
      ThumbnailsDownloader.CONCURRENT_DOWNLOADS,
      async (file: File) => {
        const thumbnailContentsId = file.thumbnailContentsIds[0];
        const thumbnailPath = path.join(
          this.downloadFolder,
          `${thumbnailContentsId}.png`
        );

        const thumbnail = await this.downloader.downloadThumbnail(
          thumbnailContentsId
        );
        const writter = fs.createWriteStream(thumbnailPath);

        thumbnail.pipe(writter);
      }
    );
  }
}
