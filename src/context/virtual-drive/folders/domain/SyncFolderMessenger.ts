import { VirtualDriveFolderIssue } from '../../../../shared/issues/VirtualDriveIssue';

export interface SyncFolderMessenger {
  creating(desiredName: string): Promise<void>;
  created(desiredName: string): Promise<void>;
  rename(currentName: string, desiredName: string): Promise<void>;
  renamed(currentName: string, desiredName: string): Promise<void>;
  error(error: VirtualDriveFolderIssue): Promise<void>;
}
