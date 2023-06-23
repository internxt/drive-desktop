import { WebdavFile } from '../../../files/domain/WebdavFile';
import { FolderStatuses } from '../../domain/FolderStatus';
import { WebdavFolder } from '../../domain/WebdavFolder';

export class WebdavFolderMother {
  static containing(file: WebdavFile) {
    return WebdavFolder.from({
      id: file.folderId,
      path: file.dirname,
      parentId: 58601041,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static any() {
    return WebdavFolder.from({
      id: 2048,
      path: '/Zodseve',
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static in(folderId: number, path: string) {
    return WebdavFolder.from({
      id: 20445,
      path,
      parentId: folderId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static withId(folderId: number) {
    return WebdavFolder.from({
      id: folderId,
      path: '/Zodseve',
      parentId: 437296692845,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static exists() {
    return WebdavFolder.from({
      id: 2048,
      path: '/Zodseve',
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.EXISTS,
    });
  }

  static trashed() {
    return WebdavFolder.from({
      id: 2048,
      path: '/Zodseve',
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: FolderStatuses.TRASHED,
    });
  }
}
