import { SyncError } from './SyncErrorCause';
import {
  VirtualDriveError,
  VirtualDriveFileError,
  VirtualDriveFolderError,
} from './VirtualDriveError';

export type VirtualDriveFolderIssue = {
  error: VirtualDriveFolderError;
  cause: SyncError;
  name: string;
};
export type VirtualDriveFileIssue = {
  error: VirtualDriveFileError;
  cause: SyncError;
  name: string;
};

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: SyncError;
  name: string;
};
