import { FileStatuses } from '../../domain/FileStatus';
import { WebdavFile } from '../../domain/WebdavFile';

export class WebdavFileMother {
  static onFolderName(path: string) {
    return WebdavFile.from({
      fileId: 'bc874b5f-5942-53b4-b21a-1c8de84c984d',
      folderId: 3972,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: `/${path}/Dilbusege.png`,
      size: 8939,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
    });
  }

  static fromPath(path: string) {
    return WebdavFile.from({
      fileId: '97e83f0d-fde7-5d2b-8158-1df5ffe8abc1',
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: path,
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
    });
  }

  static any() {
    return WebdavFile.from({
      fileId: 'bc874b5f-5942-53b4-b21a-1c8de84c984d',
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      path: '/Vakwogfud/Dilbusege.png',
      size: 893924973,
      updatedAt: new Date().toISOString(),
      status: FileStatuses.EXISTS,
    });
  }
}
