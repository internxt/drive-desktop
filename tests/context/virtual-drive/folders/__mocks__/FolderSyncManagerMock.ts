import { FolderSyncNotifier } from '../../../../../src/context/virtual-drive/folders/domain/FolderSyncNotifier';

export class FolderSyncNotifierMock implements FolderSyncNotifier {
  creatingMock = jest.fn();
  createdMock = jest.fn();
  renameMock = jest.fn();
  renamedMock = jest.fn();
  errorMock = jest.fn();

  creating(name: string): Promise<void> {
    return this.creatingMock(name);
  }
  created(name: string): Promise<void> {
    return this.createdMock(name);
  }
  rename(name: string, newName: string): Promise<void> {
    return this.renameMock(name, newName);
  }
  renamed(name: string, newName: string): Promise<void> {
    return this.renamedMock(name, newName);
  }
  error(): Promise<void> {
    return this.errorMock();
  }
}
