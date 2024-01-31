export class DateMother {
  static previousNDay(original: Date, n: number): Date {
    const clone = new Date(original.toDateString());

    clone.setDate(original.getDate() - n);

    return clone;
  }

  static previousDay = (original: Date) => DateMother.previousNDay(original, 1);

  static nextNDay(original: Date, n: number): Date {
    const clone = new Date(original.toDateString());

    clone.setDate(original.getDate() + n);

    return clone;
  }

  static nextDay = (original: Date) => DateMother.nextNDay(original, 1);

  static clone(original: Date): Date {
    return new Date(original.getTime());
  }
}
