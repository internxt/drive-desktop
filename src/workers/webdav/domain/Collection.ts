export class Collection<T> {
  constructor(public readonly values: Array<T>) {}

  has(element: T): boolean {
    return this.values.includes(element);
  }

  add(element: T): void {
    if (this.has(element)) {
      throw new Error('Element already exists');
    }

    this.values.push(element);
  }
}
