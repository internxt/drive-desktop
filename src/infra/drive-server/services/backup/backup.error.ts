export type BackupErrorCode = 'NOT_FOUND' | 'ALREADY_EXISTS' | 'ERROR';

export class BackupError extends Error {
  public readonly code: BackupErrorCode;

  constructor(message: string, code: BackupErrorCode = 'ERROR' ) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }

  static notFound(message: string): BackupError {
    return new BackupError(message, 'NOT_FOUND');
  }

  static alreadyExists(message: string): BackupError {
    return new BackupError(message, 'ALREADY_EXISTS');
  }
}
