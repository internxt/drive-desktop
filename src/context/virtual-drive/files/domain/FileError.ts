type TCode = 'FILE_SIZE_TOO_BIG';

export class FileError extends Error {
  code: TCode;
  value: unknown;

  constructor({ code, value }: { code: TCode; value: unknown }) {
    super(code);
    this.name = 'FileError';
    this.code = code;
    this.value = value;
  }
}

type TProps = {
  exc: unknown;
  addIssue?: (issue: { code: TCode }) => void;
};

export class FileErrorHandler {
  static handle({ exc, addIssue }: TProps) {
    if (!(exc instanceof FileError)) return;

    addIssue?.(exc);
  }
}
