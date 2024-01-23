import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';

export class FileAlreadyExistsError extends DriveDesktopError {
  constructor(path: string) {
    super('FILE_ALREADY_EXISTS', `File ${path} already exists`);
  }
}
