import { StorageFileSize } from '../StorageFiles/domain/StorageFileSize';
import Chance from '../../../context/shared/infrastructure/__test-helpers__/Chance';

export class StorageFileSizeMother {
  static random() {
    return new StorageFileSize(Chance.integer({ min: 0, max: StorageFileSize.MAX_SIZE }));
  }

  static primitive(): number {
    return StorageFileSizeMother.random().value;
  }
}
