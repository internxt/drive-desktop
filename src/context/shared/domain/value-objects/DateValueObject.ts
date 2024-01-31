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

  isPrevious(than: Date): boolean {
    return this.value < than;
  }

  isAfter(than: Date): boolean {
    return this.value > than;
  }

  same(than: Date): boolean {
    return this.value === than;
  }

  toISOString(): string {
    return this.value.toISOString();
  }
}
