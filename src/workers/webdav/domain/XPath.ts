import { InvalidArgumentError } from '../../shared/domain/InvalidArgumentError';
import { ValueObject } from '../../shared/domain/ValueObject';

export class XPath extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.startsWithSlash(value);
  }

  private startsWithSlash(value: string) {
    if (!value.startsWith('/')) {
      throw new InvalidArgumentError(`${value} is not a valid XPath`);
    }
  }
}
