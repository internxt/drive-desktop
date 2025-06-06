import { FolderStatuses } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import { OfflineFolder } from '../../../../../src/context/virtual-drive/folders/domain/OfflineFolder';

import Chance from 'chance';
const chance = new Chance();

export class OfflineFolderMother {
  static random(): OfflineFolder {
    return OfflineFolder.from({
      uuid: FolderUuid.random().value,
      parentId: chance.integer({ min: 1 }),
      parentUuid: FolderUuid.random().value,
      path: `/${chance.name()}`,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }
}
