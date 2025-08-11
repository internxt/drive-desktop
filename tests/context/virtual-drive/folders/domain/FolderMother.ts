import { FolderStatuses } from '../../../../../src/context/virtual-drive/folders/domain/FolderStatus';
import { Folder, FolderAttributes } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';

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

  static fromPartial(partial: Partial<FolderAttributes>) {
    const any = FolderMother.any();
    return Folder.from({ ...any.attributes(), ...partial });
  }
}
