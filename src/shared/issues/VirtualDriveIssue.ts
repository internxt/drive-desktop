import { SyncErrorCause } from './SyncErrorCause';
import {
  VirtualDriveError,
  VirtualDriveFolderError,
} from './VirtualDriveError';

export type VirtualDriveFolderIssue = {
  error: VirtualDriveFolderError;
  cause: SyncErrorCause;
  name: string;
};

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: SyncErrorCause;
  name: string;
};
