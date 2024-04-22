import { VirtualDriveFolderIssue } from '../../../../shared/issues/VirtualDriveIssue';

export abstract class SyncFolderMessenger {
  abstract creating(desiredName: string): Promise<void>;
  abstract created(desiredName: string): Promise<void>;
  abstract rename(currentName: string, desiredName: string): Promise<void>;
  abstract renamed(currentName: string, desiredName: string): Promise<void>;
  abstract issue(issue: VirtualDriveFolderIssue): Promise<void>;
}
