import { ValueObject } from '../../../../shared/domain/ValueObject';

export class FileSize extends ValueObject<number> {
  private static MAX_SIZE = 10 * 1024 * 1024 * 1024;

  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > FileSize.MAX_SIZE) {
      throw new Error('File size to big');
    }
  }
}
