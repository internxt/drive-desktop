import { ProcessFatalErrorName } from '../../../../shared/issues/VirtualDriveIssue';

export type SyncStoppedPayload =
  | { reason: 'STOPPED_BY_USER' }
  | {
      reason: 'FATAL_ERROR';
      errorName: ProcessFatalErrorName;
    };
