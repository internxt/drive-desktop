import { ValueObject } from './ValueObject';

export class BucketEntry extends ValueObject<number> {
  public static MAX_SIZE = 20 * 1024 * 1024 * 1024;

  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > BucketEntry.MAX_SIZE) {
      throw new Error('File size to big');
    }

    if (value < 0) {
      throw new Error('File size cannot be negative');
    }

    // if (value === 0) {
    //   throw new Error('File size cannot be zero');
    // }
  }
}
