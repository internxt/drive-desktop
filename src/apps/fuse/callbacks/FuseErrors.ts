import { FuseCodes } from './FuseCodes';

export class FuseError extends Error {
  public readonly code: number;
  public readonly description: string;

  constructor(code: FuseCodes, message: string, description: string) {
    super(message);

    this.code = code;
    this.description = description;
  }
}

export class NoSuchFileOrDirectoryError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.ENOENT, 'No such file or directory', description);
  }
}

export class FileOrDirectoryAlreadyExistsError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.ENOENT, 'File or directory already exists', description);
  }
}

export class IOError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.ENOENT, 'Input/output error', description);
  }
}

export class InvalidArgumentError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.ENOENT, 'Invalid argument', description);
  }
}

export class PermissionDeniedError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.ENOENT, 'Permission denied', description);
  }
}
