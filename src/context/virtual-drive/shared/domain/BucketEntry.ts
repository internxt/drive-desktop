import { ValueObject } from '../../../shared/domain/ValueObject';
import { FileError } from '../../files/domain/FileError';

export class BucketEntry extends ValueObject<number> {
  public static MAX_SIZE = 20 * 1024 * 1024 * 1024;

  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > BucketEntry.MAX_SIZE) {
      throw new FileError({ code: 'FILE_SIZE_TOO_BIG', value });
    }

    if (value < 0) {
      throw new Error(`File size cannot be negative: ${value}`);
    }
  }
}
