import { DateValueObject } from './DateValueObject';

describe('Date Value Object', () => {
  describe('creation', () => {
    it('creates DateValueObject from string', () => {
      const dateString = '2024-01-30T12:34:56.789Z';
      const dateValueObject = DateValueObject.fromString(dateString);

      expect(dateValueObject).toBeInstanceOf(DateValueObject);
      expect(dateValueObject.value.toISOString()).toBe(dateString);
    });

    it('creates DateValueObject with current date', () => {
      const currentDate = new Date('2024-01-30T12:34:56.789Z');

      vi.useFakeTimers();
      vi.setSystemTime(currentDate);

      const dateValueObject = DateValueObject.now();

      expect(dateValueObject).toBeInstanceOf(DateValueObject);
      expect(dateValueObject.same(currentDate)).toBeTruthy();

      vi.useRealTimers();
    });
  });

  describe('equality', () => {
    it('correctly checks if the date is the same', () => {
      const date = new Date('2024-01-30T12:34:56.000Z');
      const sameDate = new Date('2024-01-30T12:34:56.000Z');
      const differentDate = new Date('2000-01-30T12:34:57.000Z');

      const dateValueObject = new DateValueObject(date);

      expect(dateValueObject.same(sameDate)).toBeTruthy();
      expect(dateValueObject.same(differentDate)).toBeFalsy();
    });

    it('correctly checks if is equals to another date VO', () => {
      const date = new Date('2024-01-30T12:34:56.000Z');
      const sameDate = new Date('2024-01-30T12:34:56.000Z');
      const differentDate = new Date('2000-01-30T12:34:57.000Z');

      const dateValueObject = new DateValueObject(date);
      const sameValueObject = new DateValueObject(sameDate);
      const differentValueObject = new DateValueObject(differentDate);

      expect(dateValueObject.equals(sameValueObject)).toBeTruthy();
      expect(dateValueObject.equals(differentValueObject)).toBeFalsy();
    });
  });

  describe('comparison', () => {
    it('correctly checks if the date is previous', () => {
      const earlierDate = new Date('2023-01-30T12:34:56.000Z');
      const laterDate = new Date('2024-01-30T12:34:57.000Z');
      const dateValueObject = new DateValueObject(earlierDate);

      expect(dateValueObject.isPrevious(laterDate)).toBeTruthy();
      expect(dateValueObject.isPrevious(earlierDate)).toBeFalsy();
    });

    it('correctly checks if the date is after', () => {
      const earlierDate = new Date('2023-01-30T12:34:56.000Z');
      const laterDate = new Date('2024-01-30T12:34:57.000Z');
      const dateValueObject = new DateValueObject(laterDate);

      expect(dateValueObject.isAfter(earlierDate)).toBeTruthy();
      expect(dateValueObject.isAfter(laterDate)).toBeFalsy();
    });
  });

  it('correctly converts to ISO string', () => {
    const dateString = '2024-01-30T12:34:56.789Z';
    const dateValueObject = new DateValueObject(new Date(dateString));

    expect(dateValueObject.toISOString()).toBe(dateString);
  });
});
