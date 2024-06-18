import { Either } from '../../../../../src/context/shared/domain/Either';
import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderId } from '../../../../../src/context/virtual-drive/folders/domain/FolderId';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import {
  FolderPersistedDto,
  RemoteFileSystem,
  RemoteFileSystemErrors,
} from '../../../../../src/context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';

export class FolderRemoteFileSystemMock implements RemoteFileSystem {
  private readonly persistMock = jest.fn();
  private readonly trashMock = jest.fn();
  private readonly moveMock = jest.fn();
  private readonly renameMock = jest.fn();
  private readonly searchWithMock = jest.fn();

  searchWith(
    parentId: FolderId,
    folderPath: FolderPath
  ): Promise<Folder | undefined> {
    return this.searchWithMock(parentId, folderPath);
  }

  persist(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid | undefined
  ): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>> {
    expect(this.persistMock).toHaveBeenCalledWith(path, parentId, uuid);

    return this.persistMock();
  }

  trash(id: number): Promise<void> {
    expect(this.trashMock).toBeCalledWith(id);

    return this.trashMock();
  }

  move(folder: Folder): Promise<void> {
    expect(this.moveMock).toBeCalledWith(
      expect.objectContaining({
        _path: new FolderPath(folder.path),
        _id: new FolderId(folder.id as number),
        _parentId: new FolderId(folder.parentId as number),
      })
    );

    return this.moveMock();
  }

  rename(folder: Folder): Promise<void> {
    expect(this.renameMock).toBeCalledWith(
      expect.objectContaining({ _path: new FolderPath(folder.path) })
    );

    return this.renameMock();
  }

  shouldPersists(folder: Folder, includeUuid: boolean) {
    this.persistMock(
      new FolderPath(folder.path),
      new FolderId(folder.parentId as number),
      includeUuid ? new FolderUuid(folder.uuid) : undefined
    );

    this.persistMock.mockResolvedValueOnce({
      id: folder.id,
      uuid: folder.uuid,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
      parentId: folder.parentId as number,
    } satisfies FolderPersistedDto);
  }

  shouldTrash(folder: Folder, error?: Error) {
    this.trashMock(folder.id);

    if (error) {
      this.trashMock.mockRejectedValueOnce(error);
      return;
    }

    this.trashMock.mockReturnValue(Promise.resolve());
  }

  shouldRename(folder: Folder, error?: Error) {
    this.renameMock(folder);

    if (error) {
      this.renameMock.mockRejectedValueOnce(error);
      return;
    }

    this.renameMock.mockReturnValueOnce(Promise.resolve());
  }

  shouldMove(folder: Folder, error?: Error) {
    this.moveMock(folder);

    if (error) {
      this.moveMock.mockRejectedValueOnce(error);
      return;
    }

    this.moveMock.mockReturnValueOnce(Promise.resolve());
  }
}
