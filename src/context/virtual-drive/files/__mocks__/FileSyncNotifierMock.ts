import { SyncFileMessenger } from '../domain/SyncFileMessenger';
import { VirtualDriveFileIssue } from '../../../../shared/issues/VirtualDriveIssue';

export class FileSyncNotifierMock implements SyncFileMessenger {
  public createdMock = vi.fn().mockResolvedValue(undefined);
  public trashingMock = vi.fn().mockResolvedValue(undefined);
  public trashedMock = vi.fn().mockResolvedValue(undefined);
  public renamingMock = vi.fn().mockResolvedValue(undefined);
  public renamedMock = vi.fn().mockResolvedValue(undefined);
  public issuesMock = vi.fn().mockResolvedValue(undefined);

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
    return this.issuesMock(issue);
  }
}
