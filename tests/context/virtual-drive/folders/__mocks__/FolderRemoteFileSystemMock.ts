import { Folder } from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderId } from '../../../../../src/context/virtual-drive/folders/domain/FolderId';
import { FolderPath } from '../../../../../src/context/virtual-drive/folders/domain/FolderPath';
import { FolderUuid } from '../../../../../src/context/virtual-drive/folders/domain/FolderUuid';
import {
  FolderPersistedDto,
  RemoteFileSystem,
} from '../../../../../src/context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';

export class FolderRemoteFileSystemMock implements RemoteFileSystem {
  private readonly persistMock = jest.fn();
  private readonly trashMock = jest.fn();
  public readonly moveMock = jest.fn();
  public readonly renameMock = jest.fn();

  persist(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid | undefined
  ): Promise<FolderPersistedDto> {
    expect(this.persistMock).toHaveBeenCalledWith(path, parentId, uuid);

    return this.persistMock();
  }

  trash(id: number): Promise<void> {
    expect(this.trashMock).toBeCalledWith(id);

    return this.trashMock();
  }

  move(folder: Folder): Promise<void> {
    return this.moveMock(folder);
  }

  rename(folder: Folder): Promise<void> {
    return this.renameMock(folder);
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
}
