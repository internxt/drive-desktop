import { ErrorCause } from '../../apps/shared/types';
import { VirtualDriveError } from './VirtualDriveError';

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: ErrorCause;
  node: string;
};
