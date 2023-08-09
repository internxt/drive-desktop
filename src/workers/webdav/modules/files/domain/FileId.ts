import * as uuid from 'uuid';
import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';
import { ValueObject } from '../../../../shared/domain/ValueObject';

export class FileId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string) {
    if (!uuid.validate(value)) {
      throw new InvalidArgumentError(`Value: ${value} is not a valid uuid`);
    }
  }

  static random(): FileId {
    return new FileId(uuid.v4());
  }
}
