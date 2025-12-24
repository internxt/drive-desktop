import { InvalidArgumentError } from '../../../shared/domain/errors/InvalidArgumentError';
import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';

export class BucketEntryId extends ValueObject<string> {
  static readonly VALID_LENGTH = 24;

  constructor(value: string) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string) {
    if (value.length === 0) {
      return;
    }

    if (value.length !== BucketEntryId.VALID_LENGTH) {
      throw new InvalidArgumentError(
        `${value} is an invalid bucket entry. Expected to have ${BucketEntryId.VALID_LENGTH} characters but it has ${value.length}`,
      );
    }
  }
}
