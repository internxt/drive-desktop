import { AbsolutePath } from '../infrastructure/AbsolutePath';
import { LocalFile } from './LocalFile';

export abstract class LocalFileRepository {
  abstract files(absolutePath: AbsolutePath): Promise<Array<LocalFile>>;
  abstract folders(absolutePath: AbsolutePath): Promise<Array<AbsolutePath>>;
}
