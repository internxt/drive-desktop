import { Readable } from 'stream';
import { ThumbnailDownloader } from '../../domain/ThumbnailDownloader';
import { EnvironmentDownloader } from '../../../../virtual-drive/shared/infrastructure/EnvironmentDownloader';
import { Service } from 'diod';

@Service()
export class EnvironmentThumbnailDownloader
  extends EnvironmentDownloader
  implements ThumbnailDownloader
{
  download(thumbnailContentsId: string): Promise<Readable> {
    return super.download(thumbnailContentsId);
  }
}
