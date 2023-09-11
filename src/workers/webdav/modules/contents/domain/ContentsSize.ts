import { ValueObject } from '../../../../shared/domain/ValueObject';

export class ContentsSize extends ValueObject<number> {
  private static MAX_SIZE = 20 * 1024 * 1024 * 1024;

  constructor(value: number) {
    super(value);
    this.ensureIsValid(value);
  }

  private ensureIsValid(value: number) {
    if (value > ContentsSize.MAX_SIZE) {
      throw new Error('File size to big');
    }

    if (value < 0) {
      throw new Error('File size cannot be negative');
    }
  }
}
