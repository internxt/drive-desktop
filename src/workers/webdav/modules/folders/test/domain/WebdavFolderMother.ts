import { WebdavFile } from '../../../files/domain/WebdavFile';
import { FolderPath } from '../../domain/FolderPath';
import { WebdavFolder } from '../../domain/WebdavFolder';

export class WebdavFolderMother {
  static containing(file: WebdavFile) {
    const path = new FolderPath(file.path.dirname());

    return WebdavFolder.from({
      id: file.folderId,
      name: path.name(),
      path: path.value,
      parentId: 58601041,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  static any() {
    return WebdavFolder.from({
      id: 2048,
      name: 'Zodseve',
      path: '/Zodseve',
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  static in(folderId: number, path: string) {
    const name = new FolderPath(path).name();

    return WebdavFolder.from({
      id: 20445,
      name,
      path,
      parentId: folderId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  static withId(folderId: number) {
    return WebdavFolder.from({
      id: folderId,
      name: 'Zodseve',
      path: '/Zodseve',
      parentId: 437296692845,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
}
