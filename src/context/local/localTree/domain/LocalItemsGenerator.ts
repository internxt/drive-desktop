import { Either } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { LocalFileDTO } from '../infrastructure/LocalFileDTO';
import { LocalFolderDTO } from '../infrastructure/LocalFolderDTO';

export abstract class LocalItemsGenerator {
  abstract getAll(from: string): Promise<{
    files: Array<LocalFileDTO>;
    folders: Array<LocalFolderDTO>;
  }>;
  abstract root(
    dir: string
  ): Promise<Either<DriveDesktopError, LocalFolderDTO>>;
}
