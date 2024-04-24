import { FuseCodes } from './FuseCodes';

export class FuseError extends Error {
  public readonly code: number;

  constructor(code: FuseCodes, message: string) {
    super(message);

    this.code = code;
  }
}

export class FuseNoSuchFileOrDirectoryError extends FuseError {
  constructor(readonly path: string) {
    super(FuseCodes.ENOENT, `No such file or directory <${path}>`);
  }
}

export class FuseFileOrDirectoryAlreadyExistsError extends FuseError {
  constructor() {
    super(FuseCodes.EEXIST, 'File or directory already exists');
  }
}

export class FuseIOError extends FuseError {
  constructor() {
    super(FuseCodes.EIO, 'Input/output error');
  }
}

export class FuseInvalidArgumentError extends FuseError {
  constructor() {
    super(FuseCodes.EINVAL, 'Invalid argument');
  }
}

export class FusePermissionDeniedError extends FuseError {
  constructor() {
    super(FuseCodes.EACCES, 'Permission denied');
  }
}

export class FuseUnknownError extends FuseError {
  constructor() {
    super(FuseCodes.EIO, 'Unknown error');
  }
}
