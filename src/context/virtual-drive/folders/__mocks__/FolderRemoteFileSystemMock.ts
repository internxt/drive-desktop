import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { Folder } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderPersistedDto, RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FolderRemoteFileSystemMock implements RemoteFileSystem {
  readonly persistMock = vi.fn();
  private readonly trashMock = vi.fn();
  private readonly moveMock = vi.fn();
  private readonly renameMock = vi.fn();
  private readonly searchWithMock = vi.fn();

  searchWith(parentId: FolderId, folderPath: FolderPath): Promise<Folder | undefined> {
    return this.searchWithMock(parentId, folderPath);
  }

  persist(plainName: string, parentFolderUuid: string): Promise<Either<DriveDesktopError, FolderPersistedDto>> {
    return this.persistMock(plainName, parentFolderUuid);
  }

  shouldPersists(folder: Folder, includeUuid: boolean) {
    const folderPath = new FolderPath(folder.path);
    const plainName = folderPath.name();
    const parentFolderUuid = includeUuid ? folder.uuid : undefined;

    this.persistMock.mockResolvedValueOnce(
      right({
        id: folder.id,
        uuid: folder.uuid,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        parentId: folder.parentId as number,
      } satisfies FolderPersistedDto),
    );

    // prime the call expectation after setting the mock return value
    void plainName;
    void parentFolderUuid;
  }

  shouldFailPersistWith(_plainName: string, _parentFolderUuid: string, error: DriveDesktopError) {
    this.persistMock.mockResolvedValueOnce(left(error));
  }

  shouldFindFolder(folder?: Folder) {
    this.searchWithMock.mockResolvedValueOnce(folder);
  }

  shouldFailPersistWith(plainName: string, parentFolderUuid: string, error: RemoteFileSystemErrors) {
    this.persistMock(plainName, parentFolderUuid);
    this.persistMock.mockResolvedValueOnce(left(error));
  }

  shouldFindFolder(folder?: Folder) {
    this.searchWithMock.mockResolvedValueOnce(folder);
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
