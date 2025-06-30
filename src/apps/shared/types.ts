type FileSystemKind = 'LOCAL' | 'REMOTE';

export type ProcessFatalErrorName =
  | 'NO_INTERNET'
  | 'NO_REMOTE_CONNECTION'
  | 'CANNOT_ACCESS_BASE_DIRECTORY'
  | 'BASE_DIRECTORY_DOES_NOT_EXIST'
  | 'INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY'
  | 'CANNOT_ACCESS_TMP_DIRECTORY'
  | 'CANNOT_GET_CURRENT_LISTINGS'
  | 'UNKNOWN';

export type ProcessErrorName =
  | 'NOT_EXISTS'
  | 'NO_PERMISSION'
  | 'NO_INTERNET'
  | 'NO_REMOTE_CONNECTION'
  | 'BAD_RESPONSE'
  | 'EMPTY_FILE'
  | 'FILE_TOO_BIG'
  | 'FILE_NON_EXTENSION'
  | 'UNKNOWN'
  | 'DUPLICATED_NODE'
  | 'FILE_ALREADY_EXISTS'
  | 'BAD_REQUEST'
  | 'BASE_DIRECTORY_DOES_NOT_EXIST'
  | 'INSUFFICIENT_PERMISSION'
  | 'COULD_NOT_ENCRYPT_NAME'
  | 'NOT_ENOUGH_SPACE'
  | 'ACTION_NOT_PERMITTED'
  | 'INVALID_WINDOWS_NAME'
  | 'DELETE_ERROR';

type ProcessInfoBase = {
  kind: FileSystemKind;
  name: string;
};

type ProcessInfo = ProcessInfoBase &
  (
    | {
        action: 'UPLOADING' | 'DOWNLOADING' | 'PREPARING' | 'RENAMING' | 'DELETING';
        progress: number;
      }
    | {
        action: 'UPLOADED' | 'DOWNLOADED' | 'RENAMED' | 'DELETED' | 'DOWNLOAD_CANCEL';
      }
  );

type ProcessIssue = ProcessInfoBase & {
  action: 'UPLOAD_ERROR' | 'DOWNLOAD_ERROR' | 'RENAME_ERROR' | 'DELETE_ERROR' | 'METADATA_READ_ERROR';
  errorName: ProcessErrorName;
  process: 'SYNC' | 'BACKUPS';
};

export type ProcessInfoUpdatePayload = ProcessInfo | ProcessIssue;
