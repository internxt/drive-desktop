import { ValueObject } from '../../../../shared/domain/ValueObject';
import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';

export class FileSize extends ValueObject<number> {
  private static MAX_SIZE = 20 * 1024 * 1024 * 1024;

  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > FileSize.MAX_SIZE) {
      throw new InvalidArgumentError('File size to big');
    }

    if (value < 0) {
      throw new InvalidArgumentError('File size cannot be negative');
    }
  }
}
