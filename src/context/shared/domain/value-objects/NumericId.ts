import { InvalidArgumentError } from '../errors/InvalidArgumentError';
import { ValueObject } from './ValueObject';

export class NumericId extends ValueObject<number> {
  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value <= 0) {
      throw new InvalidArgumentError(
        `A numeric id cannot be negative, value: ${value}`
      );
    }
  }
}
