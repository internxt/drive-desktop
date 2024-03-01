import { VirtualDriveFileIssue } from '../../../../shared/issues/VirtualDriveIssue';

export interface SyncFileMessenger {
  created(name: string, extension: string): Promise<void>;
  trashing(name: string, extension: string, size: number): Promise<void>;
  trashed(name: string, extension: string, size: number): Promise<void>;
  renaming(current: string, desired: string): Promise<void>;
  renamed(current: string, desired: string): Promise<void>;
  error(error: VirtualDriveFileIssue): Promise<void>;
}
