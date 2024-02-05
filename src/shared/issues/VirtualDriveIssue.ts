import { SyncErrorCause } from './SyncErrorCause';
import { VirtualDriveError } from './VirtualDriveError';

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: SyncErrorCause;
  name: string;
};
