import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../../../src/context/shared/domain/ServerFolder';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';

export class ServerFolderMother {
  static any(): ServerFolder {
    return {
      bucket: 'acd8aa2f-8af9-5b61-b298-d52ea69588b9',
      uuid: FolderUuid.random().value,
      createdAt: new Date().toISOString(),
      id: 1762214292,
      name: 'Kiosefu',
      parentId: 1559224241,
      updatedAt: new Date().toISOString(),
      plain_name: 'Kiosefu',
      status: ServerFolderStatus.EXISTS,
    };
  }

  static fromPartial(partial: Partial<ServerFolder>): ServerFolder {
    return {
      bucket: 'acd8aa2f-8af9-5b61-b298-d52ea69588b9',
      uuid: FolderUuid.random().value,
      createdAt: new Date().toISOString(),
      id: 1762214292,
      name: 'Kiosefu',
      parentId: 1559224241,
      updatedAt: new Date().toISOString(),
      plain_name: 'Kiosefu',
      status: ServerFolderStatus.EXISTS,
      ...partial,
    };
  }
}
