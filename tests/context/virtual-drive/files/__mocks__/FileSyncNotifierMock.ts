import { SyncFileMessenger } from '../../../../../src/context/virtual-drive/files/domain/SyncFileMessenger';
import { VirtualDriveFileIssue } from '../../../../../src/shared/issues/VirtualDriveIssue';

export class FileSyncNotifierMock implements SyncFileMessenger {
  public createdMock = jest.fn();
  public trashingMock = jest.fn();
  public trashedMock = jest.fn();
  public renamingMock = jest.fn();
  public renamedMock = jest.fn();
  public errorMock = jest.fn();

  created(name: string, extension: string): Promise<void> {
    return this.createdMock(name, extension);
  }

  trashing(name: string, type: string, size: number): Promise<void> {
    return this.trashingMock(name, type, size);
  }

  trashed(name: string, type: string, size: number): Promise<void> {
    return this.trashedMock(name, type, size);
  }

  renaming(current: string, desired: string): Promise<void> {
    return this.renamingMock(current, desired);
  }

  renamed(current: string, desired: string): Promise<void> {
    return this.renamedMock(current, desired);
  }

  error(error: VirtualDriveFileIssue): Promise<void> {
    return this.errorMock(error);
  }
}
