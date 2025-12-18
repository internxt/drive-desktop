import { Either, right } from '../../../shared/domain/Either';
import { Folder } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderPersistedDto, RemoteFileSystem, RemoteFileSystemErrors } from '../domain/file-systems/RemoteFileSystem';

export class FolderRemoteFileSystemMock implements RemoteFileSystem {
  private readonly persistMock = vi.fn();
  private readonly trashMock = vi.fn();
  private readonly moveMock = vi.fn();
  private readonly renameMock = vi.fn();
  private readonly searchWithMock = vi.fn();

  searchWith(parentId: FolderId, folderPath: FolderPath): Promise<Folder | undefined> {
    return this.searchWithMock(parentId, folderPath);
  }

  persist(plainName: string, parentFolderUuid: string): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>> {
    expect(this.persistMock).toHaveBeenCalledWith(plainName, parentFolderUuid);

    return this.persistMock();
  }

  trash(id: number): Promise<void> {
    expect(this.trashMock).toBeCalledWith(id);

    return this.trashMock();
  }

  move(folderUuid: string, destinationFolderUuid: string): Promise<void> {
    return this.moveMock(folderUuid, destinationFolderUuid);
  }

  rename(folder: Folder): Promise<void> {
    expect(this.renameMock).toBeCalledWith(expect.objectContaining({ _path: new FolderPath(folder.path) }));

    return this.renameMock();
  }

  shouldPersists(folder: Folder, includeUuid: boolean) {
    const folderPath = new FolderPath(folder.path);
    const plainName = folderPath.name();
    const parentFolderUuid = includeUuid ? folder.uuid : undefined;

    this.persistMock(plainName, parentFolderUuid);

    this.persistMock.mockResolvedValueOnce(
      right({
        id: folder.id,
        uuid: folder.uuid,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        parentId: folder.parentId as number,
      } satisfies FolderPersistedDto),
    );
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

  shouldMove(error?: Error) {
    if (error) {
      this.moveMock.mockRejectedValueOnce(error);
      return;
    }

    this.moveMock.mockReturnValueOnce(Promise.resolve());
  }
}
