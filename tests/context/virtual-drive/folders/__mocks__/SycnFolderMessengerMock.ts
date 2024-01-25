import { SyncFolderMessenger } from '../../../../../src/context/virtual-drive/folders/domain/SyncFolderMessenger';

export class SyncFolderMessengerMock implements SyncFolderMessenger {
  public readonly creatingMock = jest.fn();
  public readonly createdMock = jest.fn();
  public readonly errorWhileCreatingMock = jest.fn();
  public readonly renameMock = jest.fn();
  public readonly renamedMock = jest.fn();
  public readonly errorWhileRenamingMock = jest.fn();

  creating(desiredName: string): Promise<void> {
    return this.creatingMock(desiredName);
  }
  created(desiredName: string): Promise<void> {
    return this.createdMock(desiredName);
  }
  errorWhileCreating(desiredName: string, message: string): Promise<void> {
    return this.errorWhileCreatingMock(desiredName, message);
  }
  rename(currentName: string, desiredName: string): Promise<void> {
    return this.renameMock(currentName, desiredName);
  }
  renamed(currentName: string, desiredName: string): Promise<void> {
    return this.renamedMock(currentName, desiredName);
  }
  errorWhileRenaming(
    currentName: string,
    desiredName: string,
    message: string
  ): Promise<void> {
    return this.errorWhileRenamingMock(currentName, desiredName, message);
  }
}
