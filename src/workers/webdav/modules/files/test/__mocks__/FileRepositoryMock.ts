import { Nullable } from 'shared/types/Nullable';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';

export class FileRepositoryMock implements FileRepository {
  public mockSearchByUuid = jest.fn();
  public mockDelete = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();

  searchByUuid(uuid: string): Promise<Nullable<File>> {
    return this.mockSearchByUuid(uuid);
  }

  delete(file: File): Promise<void> {
    return this.mockDelete(file);
  }

  add(file: File): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: File): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: File): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
