import { ContentsMetadata } from '../../../../../src/context/virtual-drive/contents/domain/ContentsMetadata';
import { DateMother } from '../../../shared/domain/DateMother';

describe('Contents Metadata', () => {
  it('is up to date when the modification date is the same as or later than the given date', () => {
    const date = new Date();
    const sameDate = DateMother.clone(date);
    const previousDayDate = DateMother.previousDay(date);
    const nextDayDate = DateMother.nextDay(date);

    const metadata = ContentsMetadata.from({ modificationDate: date });

    expect(metadata.isUpToDate(sameDate)).toBeTruthy();
    expect(metadata.isUpToDate(previousDayDate)).toBeTruthy();
    expect(metadata.isUpToDate(nextDayDate)).toBeFalsy();
  });
});
