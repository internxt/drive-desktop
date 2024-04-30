import { StorageVirtualId } from '../../../../../src/context/storage/StorageFiles/domain/StorageVirtualFileId';
import { UuidMother } from '../../../shared/domain/UuidMother';

export class StorageFileVirtualIdMother extends UuidMother {
  static random() {
    return UuidMother.random() as StorageVirtualId;
  }
}
