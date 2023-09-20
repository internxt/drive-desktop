import { ValueObject } from '../../../../shared/domain/ValueObject';
import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';

export class BucketEntryId extends ValueObject<string> {
  static readonly VALID_LENGTH = 24;

  constructor(value: string) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string) {
    if (value.length !== BucketEntryId.VALID_LENGTH) {
      throw new InvalidArgumentError('Invalid content id');
    }
  }
}
