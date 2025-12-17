import { SyncFolderMessenger } from '../domain/SyncFolderMessenger';
import { VirtualDriveFolderIssue } from '../../../../shared/issues/VirtualDriveIssue';

export class SyncFolderMessengerMock implements SyncFolderMessenger {
  public creatingMock = vi.fn();
  public createdMock = vi.fn();
  public renameMock = vi.fn();
  public renamedMock = vi.fn();
  public issuesMock = vi.fn();

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

  issue(error: VirtualDriveFolderIssue): Promise<void> {
    return this.issuesMock(error);
  }
}
