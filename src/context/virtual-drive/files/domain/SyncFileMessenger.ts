import { VirtualDriveFileIssue } from '../../../../shared/issues/VirtualDriveIssue';

export abstract class SyncFileMessenger {
  abstract created(name: string, extension: string): Promise<void>;
  abstract trashing(
    name: string,
    extension: string,
    size: number
  ): Promise<void>;
  abstract trashed(
    name: string,
    extension: string,
    size: number
  ): Promise<void>;
  abstract renaming(current: string, desired: string): Promise<void>;
  abstract renamed(current: string, desired: string): Promise<void>;
  abstract issues(issue: VirtualDriveFileIssue): Promise<void>;
}
