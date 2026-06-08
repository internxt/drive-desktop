import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../../../../backend/features/user/file-size-limit';
import { ValueObject } from './ValueObject';

export class BucketEntry extends ValueObject<number> {
  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT) {
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
