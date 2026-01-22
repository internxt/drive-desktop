import { SyncError } from '../../../shared/issues/SyncErrorCause';

export type BackupErrorRecord = {
  name: string;
  error: SyncError;
};
