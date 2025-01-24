const BackupErrorCauses = [
  'NOT_EXISTS',
  'NO_PERMISSION',
  'NO_INTERNET',
  'NO_REMOTE_CONNECTION',
  'BAD_RESPONSE',
  'EMPTY_FILE',
  'FILE_TOO_BIG',
  'FILE_NON_EXTENSION',
  'UNKNOWN',
  'FILE_ALREADY_EXISTS',
  'FOLDER_ALREADY_EXISTS',
] as const;

type BackupErrorCause = (typeof BackupErrorCauses)[number];

export const BackUpErrorCause: { [K in BackupErrorCause]: K } = {
  NOT_EXISTS: 'NOT_EXISTS',
  NO_PERMISSION: 'NO_PERMISSION',
  NO_INTERNET: 'NO_INTERNET',
  NO_REMOTE_CONNECTION: 'NO_REMOTE_CONNECTION',
  BAD_RESPONSE: 'BAD_RESPONSE',
  EMPTY_FILE: 'EMPTY_FILE',
  FILE_TOO_BIG: 'FILE_TOO_BIG',
  FILE_NON_EXTENSION: 'FILE_NON_EXTENSION',
  UNKNOWN: 'UNKNOWN',
  FILE_ALREADY_EXISTS: 'FILE_ALREADY_EXISTS',
  FOLDER_ALREADY_EXISTS: 'FOLDER_ALREADY_EXISTS',
} as const;

export class BackupError extends Error {
  constructor(public readonly cause: BackupErrorCause) {
    super();
  }
}
