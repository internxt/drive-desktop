import { DriveServerWipError, TDriveServerWipError } from '../../defs';

export class CreateFileError extends DriveServerWipError {
  constructor(
    public readonly code:
      | TDriveServerWipError
      | 'PARENT_NOT_FOUND'
      | 'FILE_ALREADY_EXISTS'
      | 'FILE_UPLOAD_SIZE_EXCEEDED'
      | 'EMPTY_FILES_NOT_ALLOWED'
      | 'EMPTY_FILES_EXCEEDED',
    cause: unknown,
    response?: Response,
  ) {
    super(code, cause, response);
  }
}
