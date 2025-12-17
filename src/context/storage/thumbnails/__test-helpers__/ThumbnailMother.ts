import { BucketEntryIdMother } from 'src/context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { Thumbnail, ThumbnailAttributes } from '../domain/Thumbnail';
import Chance from '../../../shared/infrastructure/__test-helpers__/Chance';
export class ThumbnailMother {
  static any(): Thumbnail {
    return Thumbnail.from({
      id: Chance.integer({ min: 1000 }),
      contentsId: BucketEntryIdMother.primitive(),
      type: 'png',
      bucket: 'bucket',
      updatedAt: Chance.date(),
    });
  }

  static fromPartial(partial: Partial<ThumbnailAttributes>): Thumbnail {
    return Thumbnail.from({
      ...ThumbnailMother.any().attributes(),
      ...partial,
    });
  }
}
