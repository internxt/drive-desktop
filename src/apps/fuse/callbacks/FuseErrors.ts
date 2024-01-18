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

export class FuseNoSuchFileOrDirectoryError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.ENOENT, 'No such file or directory', description);
  }

  static translate(error: Error): FuseNoSuchFileOrDirectoryError {
    return new FuseNoSuchFileOrDirectoryError(error.message);
  }
}

export class FuseFileOrDirectoryAlreadyExistsError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.EEXIST, 'File or directory already exists', description);
  }

  static translate(error: Error): FuseFileOrDirectoryAlreadyExistsError {
    return new FuseFileOrDirectoryAlreadyExistsError(error.message);
  }
}

export class FuseIOError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.EIO, 'Input/output error', description);
  }

  static translate(error: Error): FuseIOError {
    return new FuseIOError(error.message);
  }
}

export class FuseInvalidArgumentError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.EINVAL, 'Invalid argument', description);
  }

  static translate(error: Error): FuseInvalidArgumentError {
    return new FuseInvalidArgumentError(error.message);
  }
}

export class FusePermissionDeniedError extends FuseError {
  constructor(description: string) {
    super(FuseCodes.EACCES, 'Permission denied', description);
  }

  static translate(error: Error): FusePermissionDeniedError {
    return new FusePermissionDeniedError(error.message);
  }
}
