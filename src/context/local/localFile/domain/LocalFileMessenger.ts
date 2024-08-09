import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { LocalFile } from './LocalFile';

export abstract class LocalFileMessenger {
  abstract creationFailed(
    file: LocalFile,
    error: DriveDesktopError
  ): Promise<void>;
}
