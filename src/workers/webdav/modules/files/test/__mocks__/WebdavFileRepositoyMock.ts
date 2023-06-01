import { Nullable } from 'shared/types/Nullable';
import { WebdavFile } from '../../domain/WebdavFile';
import { WebdavFileRepository } from '../../domain/WebdavFileRepository';

export class WebdavFileRepositoryMock implements WebdavFileRepository {
  public mockSearch = jest.fn();
  public mockDelete = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();

  search(pathLike: string): Nullable<WebdavFile> {
    return this.mockSearch(pathLike);
  }
  delete(file: WebdavFile): Promise<void> {
    return this.mockDelete(file);
  }

  add(file: WebdavFile): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: WebdavFile): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: WebdavFile): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  markForDeletion(file: WebdavFile): void {
    throw new Error('Method not implemented.');
  }
  searchOnFolder(folderId: number): WebdavFile[] {
    throw new Error('Method not implemented.');
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
