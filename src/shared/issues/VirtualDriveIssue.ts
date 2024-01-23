import { ErrorCause } from '../../context/virtual-drive/shared/domain/ErrorCause';
import { VirtualDriveError } from './VirtualDriveError';

export type VirtualDriveIssue = {
  error: VirtualDriveError;
  cause: ErrorCause;
  name: string;
};
