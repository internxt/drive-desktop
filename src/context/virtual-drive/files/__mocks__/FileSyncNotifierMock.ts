import { SyncFileMessenger } from '../domain/SyncFileMessenger';
import { VirtualDriveFileIssue } from '../../../../shared/issues/VirtualDriveIssue';

export class FileSyncNotifierMock implements SyncFileMessenger {
  public createdMock = vi.fn();
  public trashingMock = vi.fn();
  public trashedMock = vi.fn();
  public renamingMock = vi.fn();
  public renamedMock = vi.fn();
  public issueMock = vi.fn();

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

  issues(issue: VirtualDriveFileIssue): Promise<void> {
    return this.issueMock(issue);
  }
}
