import { Either } from '../../../../../src/context/shared/domain/Either';
import { DriveDesktopError } from '../../../../../src/context/shared/domain/errors/DriveDesktopError';
import { File } from '../../../../../src/context/virtual-drive/files/domain/File';
import {
  FileDataToPersist,
  PersistedFileData,
  RemoteFileSystem,
} from '../../../../../src/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';

export class RemoteFileSystemMock implements RemoteFileSystem {
  public readonly persistMock = jest.fn();
  public readonly trashMock = jest.fn();
  public readonly deleteMock = jest.fn();
  public readonly moveMock = jest.fn();
  public readonly renameMock = jest.fn();
  public readonly overrideMock = jest.fn();
  public readonly hardDeleteMock = jest.fn();

  persist(
    offline: FileDataToPersist
  ): Promise<Either<DriveDesktopError, PersistedFileData>> {
    return this.persistMock(offline);
  }

  trash(contentsId: string): Promise<void> {
    return this.trashMock(contentsId);
  }

  delete(file: File): Promise<void> {
    return this.deleteMock(file);
  }

  move(file: File, destinationFolderUuid: string): Promise<void> {
    return this.moveMock(file, destinationFolderUuid);
  }

  rename(file: File, folderUuid: string): Promise<void> {
    return this.renameMock(file, folderUuid);
  }

  override(file: File): Promise<void> {
    return this.overrideMock(file);
  }

  hardDelete(contentsId: string): Promise<void> {
    return this.hardDeleteMock(contentsId);
  }
}
