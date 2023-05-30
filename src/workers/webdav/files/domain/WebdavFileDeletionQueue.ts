import { WebdavFile } from './WebdavFile';

export interface WebdavFileDeletionQueue {
  add(file: WebdavFile): void;
  commit(folderId: number): Promise<void>;
}
