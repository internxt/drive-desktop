import { WebdavFile } from '../../domain/WebdavFile';

export class WebdavFileMother {
  static onFolderName(path: string) {
    return WebdavFile.from({
      fileId: 'bc874b5f-5942-53b4-b21a-1c8de84c984d',
      folderId: 3972,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      name: 'Dilbusege',
      path: `/${path}/Dilbusege.png`,
      size: 89392497343943580,
      type: 'png',
      updatedAt: new Date().toISOString(),
    });
  }

  static any() {
    return WebdavFile.from({
      fileId: 'bc874b5f-5942-53b4-b21a-1c8de84c984d',
      folderId: 3972960,
      createdAt: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      name: 'Dilbusege',
      path: '/Vakwogfud/Dilbusege.png',
      size: 89392497343943580,
      type: 'png',
      updatedAt: new Date().toISOString(),
    });
  }
}
