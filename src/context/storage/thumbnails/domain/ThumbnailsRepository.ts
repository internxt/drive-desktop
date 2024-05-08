import { Readable } from 'stream';
import { File } from '../../../virtual-drive/files/domain/File';
import { Thumbnail } from './Thumbnail';
import { ThumbnailCollection } from './ThumbnailCollection';

export abstract class ThumbnailsRepository {
  abstract has(file: File): Promise<boolean>;

  abstract retrieve(file: File): Promise<ThumbnailCollection | undefined>;

  abstract pull(thumbnail: Thumbnail): Promise<Readable>;

  abstract push(file: File, stream: Readable): Promise<void>;

  abstract default(file: File): Promise<void>;
}
