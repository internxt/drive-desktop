export class DateMother {
  private static previousNDay(original: Date, n: number): Date {
    const clone = new Date(original.toDateString());

    clone.setDate(original.getDate() - n);

    return clone;
  }

  static previousDay = (original: Date) => DateMother.previousNDay(original, 1);
}
