import {
  LocalFolder,
  LocalFolderAttributes,
} from '../../../../../src/context/local/localFolder/domain/LocalFolder';
import { AbsolutePathMother } from '../../../shared/infrastructure/AbsolutePathMother';

import Chance from '../../../shared/infrastructure/Chance';

export class LocalFolderMother {
  static any(): LocalFolder {
    return LocalFolder.from({
      path: AbsolutePathMother.anyFolder(),
      modificationTime: Chance.integer({ min: 1 }),
    });
  }

  static fromPartial(partial: Partial<LocalFolderAttributes>): LocalFolder {
    return LocalFolder.from({
      ...LocalFolderMother.any().attributes(),
      ...partial,
    });
  }
}
