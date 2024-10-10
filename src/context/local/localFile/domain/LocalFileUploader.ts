import { Either } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { AbsolutePath } from '../infrastructure/AbsolutePath';

export abstract class LocalFileHandler {
  abstract upload(
    path: AbsolutePath,
    size: number,
    abortSignal: AbortSignal
  ): Promise<Either<DriveDesktopError, string>>;

  abstract delete(contentsId: string): Promise<void>;
}
