import { StorageFileSize } from '../../../../../src/context/storage/StorageFiles/domain/StorageFileSize';
import Chance from '../../../shared/infrastructure/Chance';

export class StorageFileSizeMother {
  static random() {
    return new StorageFileSize(
      Chance.integer({ min: 0, max: StorageFileSize.MAX_SIZE })
    );
  }

  static primitive(): number {
    return StorageFileSizeMother.random().value;
  }
}
