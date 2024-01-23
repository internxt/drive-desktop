import { ErrorCause } from '../../../context/virtual-drive/shared/domain/ErrorCause';
import { ErrorDetails } from './ErrorDetails';

export class ProcessError extends Error {
  details: ErrorDetails;

  constructor(name: ErrorCause, details: ErrorDetails) {
    super();
    this.name = name;
    this.details = details;
  }
}
