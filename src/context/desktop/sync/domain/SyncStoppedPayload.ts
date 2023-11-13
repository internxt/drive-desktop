import { ProcessFatalErrorName } from '../../../../apps/shared/types';

export type SyncStoppedPayload =
  | { reason: 'STOPPED_BY_USER' }
  | {
      reason: 'FATAL_ERROR';
      errorName: ProcessFatalErrorName;
    };
