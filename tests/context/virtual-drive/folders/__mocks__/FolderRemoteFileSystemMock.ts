import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderId } from '../../../../../src/context/virtual-drive/folders/domain/FolderId';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import {
  FolderPersistedDto,
  RemoteFileSystem,
} from '../../../../../src/context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';

export class FolderRemoteFileSystemMock implements RemoteFileSystem {
  public readonly persistMock = jest.fn();
  public readonly trashMock = jest.fn();
  public readonly moveMock = jest.fn();
  public readonly renameMock = jest.fn();

  persist(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid | undefined
  ): Promise<FolderPersistedDto> {
    return this.persistMock(path, parentId, uuid);
  }

  trash(id: number): Promise<void> {
    return this.trashMock(id);
  }
  move(folder: Folder): Promise<void> {
    return this.moveMock(folder);
  }
  rename(folder: Folder): Promise<void> {
    return this.renameMock(folder);
  }
}
