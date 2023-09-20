import { File } from '../../../files/domain/File';
import { FolderStatuses } from '../../domain/FolderStatus';
import { Folder } from '../../domain/Folder';
import { FolderUuid } from '../../domain/FolderUuid';

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
      path: '/Zodseve',
      parentId: null,
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
      parentId: null,
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
}
