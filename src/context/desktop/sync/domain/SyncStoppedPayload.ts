import { FatalError } from '../../../../shared/issues/FatalError';

export type SyncStoppedPayload =
  | { reason: 'STOPPED_BY_USER' }
  | {
      reason: 'FATAL_ERROR';
      errorName: FatalError;
    };
