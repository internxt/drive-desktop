import { SyncFileMessenger } from '../../../../../src/context/virtual-drive/files/domain/SyncFileMessenger';

export class FileSyncNotifierMock implements SyncFileMessenger {
  public createdMock = jest.fn();
  public errorMock = jest.fn();
  public trashingMock = jest.fn();
  public trashedMock = jest.fn();
  public errorWhileTrashingMock = jest.fn();

  created(name: string, extension: string): Promise<void> {
    return this.createdMock(name, extension);
  }
  error(name: string, extension: string, message: string): Promise<void> {
    return this.errorMock(name, extension, message);
  }
  trashing(name: string, type: string, size: number): Promise<void> {
    return this.trashingMock(name, type, size);
  }
  trashed(name: string, type: string, size: number): Promise<void> {
    return this.trashedMock(name, type, size);
  }
  errorWhileTrashing(
    name: string,
    type: string,
    message: string
  ): Promise<void> {
    return this.errorWhileTrashing(name, type, message);
  }
}
