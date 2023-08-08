import { WebdavFile } from '../../../files/domain/WebdavFile';
import { FolderStatuses } from '../../domain/FolderStatus';
import { Folder } from '../../domain/Folder';

export class FolderMother {
  static containing(file: WebdavFile) {
    return Folder.from({
      id: file.folderId,
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
      path: '/Zodseve',
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.TRASHED,
    });
  }
}
