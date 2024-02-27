import * as uuid from 'uuid';
import { InvalidArgumentError } from '../../../shared/domain/errors/InvalidArgumentError';
import { ValueObject } from '../../../shared/domain/value-objects/ValueObject';

export class FolderUuid extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string) {
    if (!uuid.validate(value)) {
      throw new InvalidArgumentError(`Value: ${value} is not a valid uuid`);
    }
  }

  static random(): FolderUuid {
    return new FolderUuid(uuid.v4());
  }
}
