export class Optional<T> {
  constructor(private readonly value: T | undefined) {}

  static of<T>(value: T): Optional<T> {
    return new Optional(value);
  }

  static empty<T>(): Optional<T> {
    return new Optional<T>(undefined);
  }

  get(): T {
    if (!this.value) {
      throw new Error('Element not found');
    }

    return this.value;
  }

  isPresent(): boolean {
    return this.value !== undefined;
  }
}
