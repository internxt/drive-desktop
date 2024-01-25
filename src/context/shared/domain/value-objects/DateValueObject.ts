import { ValueObject } from './ValueObject';

export class DateValueObject extends ValueObject<Date> {
  static fromString(value: string): DateValueObject {
    const date = new Date(value);

    return new DateValueObject(date);
  }

  static now(): DateValueObject {
    const date = new Date();

    return new DateValueObject(date);
  }

  toISOString(): string {
    return this.value.toISOString();
  }
}
