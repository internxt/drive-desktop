import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import { FolderStatuses } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import {
  Folder,
  FolderAttributes,
} from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import Chance from 'chance';
import { FolderPathMother } from './FolderPathMother';
const chance = new Chance();

export class FolderMother {
  static containing(file: File) {
    return Folder.from({
      id: file.folderId,
      uuid: FolderUuid.random().value,
      path: file.dirname,
      parentId: 58601041,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static any() {
    return Folder.from({
      id: 2048,
      uuid: FolderUuid.random().value,
      path: FolderPathMother.any().value,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static withId(folderId: number) {
    return Folder.from({
      id: folderId,
      uuid: FolderUuid.random().value,
      path: '/Zodseve',
      parentId: 437296692845,
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
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.TRASHED,
    });
  }

  static root() {
    return Folder.from({
      id: 2048,
      uuid: FolderUuid.random().value,
      path: '/',
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static fromPartial(partial: Partial<FolderAttributes>) {
    const any = FolderMother.any();
    return Folder.from({ ...any.attributes(), ...partial });
  }
}
