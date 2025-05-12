type TProps = {
  cause: 'UNKNOWN' | 'NON_EXISTS';
  originalError: unknown;
  message?: string;
};

export class FileSystemError extends Error {
  originalError: unknown;

  constructor({ cause, originalError, message }: TProps) {
    super(message);

    this.name = 'FileSystemError';
    this.cause = cause;
    this.originalError = originalError;
  }
}
