import { StorageVirtualId } from '../StorageFiles/domain/StorageVirtualFileId';
import { UuidMother } from '../../shared/domain/__test-helpers__/UuidMother';

export class StorageFileVirtualIdMother extends UuidMother {
  static random() {
    return UuidMother.random() as StorageVirtualId;
  }
}
