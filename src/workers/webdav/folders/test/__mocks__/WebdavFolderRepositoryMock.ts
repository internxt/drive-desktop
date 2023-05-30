import { Nullable } from 'shared/types/Nullable';
import { WebdavFolder } from '../../domain/WebdavFolder';
import { WebdavFolderRepository } from '../../domain/WebdavFolderRepository';

export class WebdavFolderRepositoryMock implements WebdavFolderRepository {
  public mockSearch = jest.fn();
  public mockDelete = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();

  search(pathLike: string): Nullable<WebdavFolder> {
    return this.mockSearch(pathLike);
  }

  delete(file: WebdavFolder): Promise<void> {
    return this.mockDelete(file);
  }

  add(file: WebdavFolder): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: WebdavFolder): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: WebdavFolder): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
