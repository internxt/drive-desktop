import { SyncError } from '../../../shared/issues/SyncErrorCause';
import { ErrorDetails } from './ErrorDetails';

export class ProcessError extends Error {
  details: ErrorDetails;

  constructor(name: SyncError, details: ErrorDetails) {
    super();
    this.name = name;
    this.details = details;
  }
}
