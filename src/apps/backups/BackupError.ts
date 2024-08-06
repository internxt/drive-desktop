type BackupErrorCause =
  | 'NOT_EXISTS'
  | 'NO_PERMISSION'
  | 'NO_INTERNET'
  | 'NO_REMOTE_CONNECTION'
  | 'BAD_RESPONSE'
  | 'EMPTY_FILE'
  | 'FILE_TOO_BIG'
  | 'FILE_NON_EXTENSION'
  | 'UNKNOWN'
  | 'FILE_ALREADY_EXISTS'
  | 'FOLDER_ALREADY_EXISTS';

export class BackupError extends Error {
  constructor(public readonly cause: BackupErrorCause) {
    super();
  }
}
