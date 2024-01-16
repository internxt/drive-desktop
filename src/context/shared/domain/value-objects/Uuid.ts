import * as uuid from 'uuid';
import { InvalidArgumentError } from '../InvalidArgumentError';
import { ValueObject } from './ValueObject';

export class Uuid extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string) {
    if (!uuid.validate(value)) {
      throw new InvalidArgumentError(`Value: ${value} is not a valid uuid`);
    }
  }

  static random(): Uuid {
    return new Uuid(uuid.v4());
  }
}
