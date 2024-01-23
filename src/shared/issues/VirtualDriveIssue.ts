import { ErrorCause } from './ErrorCause';
import { VirtualDriveError } from './VirtualDriveError';

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: ErrorCause;
  name: string;
};
