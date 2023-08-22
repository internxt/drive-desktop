import { Readable } from 'stream';
import { EnvironmentDownloader } from '../../shared/infrastructure/EnvironmentDownloader';
import { ThumbnailDownloader } from '../domain/ThumbnailDownloader';

export class EnvironmentThumbnailDownloader
  extends EnvironmentDownloader
  implements ThumbnailDownloader
{
  downloadThumbnail(thumbnailContentsId: string): Promise<Readable> {
    return this.download(thumbnailContentsId);
  }
}
