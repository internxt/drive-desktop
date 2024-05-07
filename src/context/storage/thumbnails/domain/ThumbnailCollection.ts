import { File } from '../../../virtual-drive/files/domain/File';
import { Thumbnail } from './Thumbnail';

export class ThumbnailCollection {
  readonly thumbnails: Array<Thumbnail>;

  constructor(readonly file: File, thumbnails: Array<Thumbnail>) {
    this.validate(thumbnails);
    this.thumbnails = thumbnails.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  private validate(thumbnails: Thumbnail[]) {
    if (thumbnails.length > 0) {
      return;
    }

    throw new Error(
      'A Thumbnail Collection has to have at least one thumbnail'
    );
  }

  getLatestThumbnail(): Thumbnail {
    return this.thumbnails[this.thumbnails.length - 1];
  }
}
