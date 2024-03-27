import { BucketEntry } from '../../../shared/domain/value-objects/BucketEntry';
import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';

export class OfflineFileSize extends ValueObject<number> {
  public static MAX_SIZE = BucketEntry.MAX_SIZE;

  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > BucketEntry.MAX_SIZE) {
      throw new Error('Offline File size to big');
    }

    if (value < 0) {
      throw new Error('Offline File size cannot be negative');
    }
  }

  increment(bytes: number): OfflineFileSize {
    return new OfflineFileSize(this.value + bytes);
  }
}
