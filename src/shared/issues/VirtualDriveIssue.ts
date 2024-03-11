import { SyncErrorCause } from './SyncErrorCause';
import {
  VirtualDriveError,
  VirtualDriveFileError,
  VirtualDriveFolderError,
} from './VirtualDriveError';

export type VirtualDriveFolderIssue = {
  error: VirtualDriveFolderError;
  cause: SyncErrorCause;
  name: string;
};
export type VirtualDriveFileIssue = {
  error: VirtualDriveFileError;
  cause: SyncErrorCause;
  name: string;
};

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: SyncErrorCause;
  name: string;
};
