import Chance from 'chance';
import { BucketEntryId } from '../../../../../src/context/virtual-drive/shared/domain/BucketEntryId';

const chance = new Chance();

export class BucketEntryIdMother {
  static random(): BucketEntryId {
    const raw = chance.string({ length: BucketEntryId.VALID_LENGTH });
    return new BucketEntryId(raw);
  }

  static primitive(): string {
    return chance.string({ length: BucketEntryId.VALID_LENGTH });
  }
}
