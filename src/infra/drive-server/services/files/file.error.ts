const FileErrorCauses = [
  'NO_PERMISSION',
  'BAD_REQUEST',
  'SERVER_ERROR',
  'UNKNOWN',
  'FILE_ALREADY_EXISTS',
] as const;

export type FileErrorCause = (typeof FileErrorCauses)[number];

export class FileError extends Error {
  constructor(public readonly cause: FileErrorCause) {
    super();
  }
}
