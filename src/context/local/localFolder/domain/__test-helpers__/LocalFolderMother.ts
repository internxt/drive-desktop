import { AbsolutePathMother } from './../../../../shared/infrastructure/__test-helpers__/AbsolutePathMother';
import { LocalFolder, LocalFolderAttributes } from '../LocalFolder';
import Chance from '../../../../../context/shared/infrastructure/__test-helpers__/Chance';
export class LocalFolderMother {
  static any(): LocalFolder {
    return LocalFolder.from(AbsolutePathMother.anyFolder(), Chance.integer({ min: 1 }));
  }

  static fromPartial(partial: Partial<LocalFolderAttributes>): LocalFolder {
    const attributes = {
      ...LocalFolderMother.any().attributes(),
      ...partial,
    };
    return LocalFolder.from(attributes.path, attributes.modificationTime);
  }
}
