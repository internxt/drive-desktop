import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';

export class LocalFileSize extends ValueObject<number> {
  static readonly MAX_SMALL_FILE_SIZE = 1024 * 1024;
  static readonly MAX_MEDIUM_FILE_SIZE = 20 * 1024 * 1024;

  constructor(value: number) {
    super(value);

    this.validate(value);
  }

  private validate(value: number) {
    if (value <= 0) {
      throw new Error(`A remote file size cannot have value ${value}`);
    }
  }

  isSmall(): boolean {
    return this.value <= LocalFileSize.MAX_SMALL_FILE_SIZE;
  }

  isMedium(): boolean {
    return (
      this.value > LocalFileSize.MAX_SMALL_FILE_SIZE &&
      this.value <= LocalFileSize.MAX_MEDIUM_FILE_SIZE
    );
  }

  isBig(): boolean {
    return this.value > LocalFileSize.MAX_MEDIUM_FILE_SIZE;
  }
}
