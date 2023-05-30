import { WebdavFile } from 'workers/webdav/files/domain/WebdavFile';
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
}
