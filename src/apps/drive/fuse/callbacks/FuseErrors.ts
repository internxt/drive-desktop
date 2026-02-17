import { FuseCodes } from './FuseCodes';

export class FuseError extends Error {
  public readonly code: number;
  public readonly timestamp: Date;

  constructor(code: FuseCodes, message: string) {
    super(message);
    this.code = code;
    this.timestamp = new Date();
  }
}

export class FuseNoSuchFileOrDirectoryError extends FuseError {
  constructor(readonly path: string) {
    super(FuseCodes.ENOENT, `No such file or directory: <${path}>`);
  }
}

export class FuseFileOrDirectoryAlreadyExistsError extends FuseError {
  constructor() {
    super(FuseCodes.EEXIST, 'File or directory already exists.');
  }
}

export class FuseIOError extends FuseError {
  constructor(details?: string) {
    super(FuseCodes.EIO, `Input/output error${details ? `: ${details}` : ''}.`);
  }
}

export class FuseUnknownError extends FuseError {
  constructor(details?: string) {
    super(FuseCodes.EIO, `Unknown error${details ? `: ${details}` : ''}.`);
  }
}
