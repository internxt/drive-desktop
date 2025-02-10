import { SyncError } from './SyncErrorCause';
import { VirtualDriveError } from './VirtualDriveError';

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: SyncError;
  name: string;
};
