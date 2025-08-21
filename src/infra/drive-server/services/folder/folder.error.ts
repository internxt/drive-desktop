const FolderErrorCauses = [
  'NO_PERMISSION',
  'BAD_REQUEST',
  'SERVER_ERROR',
  'UNKNOWN',
  'FOLDER_ALREADY_EXISTS',
] as const;

export type FolderErrorCause = (typeof FolderErrorCauses)[number];

export class FolderError extends Error {
  constructor(public readonly cause: FolderErrorCause) {
    super();
  }
}
