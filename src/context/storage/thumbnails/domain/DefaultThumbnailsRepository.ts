import { File } from '../../../virtual-drive/files/domain/File';

export abstract class DefaultThumbnailsRepository {
  abstract push(file: File): Promise<void>;
}
