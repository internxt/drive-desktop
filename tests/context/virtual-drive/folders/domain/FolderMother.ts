import Chance from 'chance';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import {
  Folder,
  FolderAttributes,
} from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderStatuses } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import { FolderIdMother } from './FolderIdMother';
import { FolderPathMother } from './FolderPathMother';

const chance = new Chance();

export class FolderMother {
  private static readonly MAX_ARRAY_GENERATION = 10;

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
      id: FolderIdMother.any().value,
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

  static createChildForm(root: Folder) {
    return FolderMother.fromPartial({
      path: FolderPathMother.onFolder(new FolderPath(root.path)).value,
      parentId: root.id as number,
    });
  }

  static array(partial?: Partial<FolderAttributes>): Array<Folder> {
    return new Array(
      chance.integer({ min: 1, max: FolderMother.MAX_ARRAY_GENERATION })
    )
      .fill(0)
      .map(() => FolderMother.fromPartial(partial ?? {}));
  }
}
