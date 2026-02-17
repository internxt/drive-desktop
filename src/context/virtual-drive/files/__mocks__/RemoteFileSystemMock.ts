import { Either } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { File } from '../domain/File';
import { FileDataToPersist, PersistedFileData, RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class RemoteFileSystemMock implements RemoteFileSystem {
  public readonly persistMock = vi.fn();
  public readonly trashMock = vi.fn();
  public readonly deleteMock = vi.fn();
  public readonly moveMock = vi.fn();
  public readonly renameMock = vi.fn();
  public readonly overrideMock = vi.fn();
  public readonly hardDeleteMock = vi.fn();

  persist(offline: FileDataToPersist): Promise<Either<DriveDesktopError, PersistedFileData>> {
    return this.persistMock(offline);
  }
}
