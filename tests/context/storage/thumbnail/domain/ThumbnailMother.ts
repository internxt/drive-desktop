import {
  Thumbnail,
  ThumbnailAttributes,
} from '../../../../../src/context/storage/thumbnails/domain/Thumbnail';
import Chance from '../../../shared/infrastructure/Chance';
import { BucketEntryIdMother } from '../../../virtual-drive/shared/domain/BucketEntryIdMother';

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
