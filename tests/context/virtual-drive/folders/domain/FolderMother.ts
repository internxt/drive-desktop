import { FolderStatuses } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import { Folder, FolderAttributes } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import Chance from 'chance';
const chance = new Chance();

export class FolderMother {
  static any() {
    return Folder.from({
      id: 2048,
      uuid: FolderUuid.random().value,
      path: '/Zodseve',
      parentId: null,
      parentUuid: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static in(folderId: number, path: string) {
    return Folder.from({
      id: 20445,
      uuid: FolderUuid.random().value,
      path,
      parentId: folderId,
      parentUuid: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static exists() {
    return Folder.from({
      id: 2048,
      uuid: FolderUuid.random().value,
      path: '/Zodseve',
      parentId: chance.integer({ min: 1 }),
      parentUuid: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static trashed() {
    return Folder.from({
      id: 2048,
      uuid: FolderUuid.random().value,
      path: '/Zodseve',
      parentUuid: null,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.TRASHED,
    });
  }

  static fromPartial(partial: Partial<FolderAttributes>) {
    const any = FolderMother.any();
    return Folder.from({ ...any.attributes(), ...partial });
  }
}
