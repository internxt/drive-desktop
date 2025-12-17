import { StorageFile, StorageFileAttributes } from '../StorageFiles/domain/StorageFile';
import { StorageFileSizeMother } from './StorageFileSizeMother';
import { StorageFileIdMother } from './StorageFileIdMother';
import { StorageFileVirtualIdMother } from './StorageFileVirtualIdMother';

export class StorageFileMother {
  static random(): StorageFile {
    return StorageFile.from({
      id: StorageFileIdMother.primitive(),
      virtualId: StorageFileVirtualIdMother.primitive(),
      size: StorageFileSizeMother.primitive(),
    });
  }

  static fromPartial(partial: Partial<StorageFileAttributes>): StorageFile {
    return StorageFile.from({
      ...StorageFileMother.random().attributes(),
      ...partial,
    });
  }
}
