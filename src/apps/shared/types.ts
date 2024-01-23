import { AppErrorName } from '../../shared/issues/AppIssue';

export type ErrorCause =
  // File or folder does not exist
  | 'NOT_EXISTS'

  // No permission to read or write file or folder
  | 'NO_PERMISSION'

  // No internet connection
  | 'NO_INTERNET'

  // Could not connect to Internxt servers
  | 'NO_REMOTE_CONNECTION'

  // Had a bad response (not in the 200 status range) from the server
  | 'BAD_RESPONSE'

  // The file has a size of 0 bytes
  | 'EMPTY_FILE'

  // The file is bigger than the current upload limit
  | 'FILE_TOO_BIG'

  // The file don't have an extension
  | 'FILE_NON_EXTENSION'

  // Unknown error
  | 'UNKNOWN'

  // Duplicated node path
  | 'DUPLICATED_NODE';

export class ProcessError extends Error {
  details: ErrorDetails;

  constructor(name: ErrorCause, details: ErrorDetails) {
    super();
    this.name = name;
    this.details = details;
  }
}

/**
 * Only for error reporting purposes, should not be used
 * to adjust UI to specific errors for example.
 * That's what SyncError and SyncFatalError classes are for
 */
export type ErrorDetails = {
  /* Describes in natural language what was being
   done when this error was thrown */
  action: string;

  // Message of the original error instance
  message: string;
  // Error code of the original error instance
  code: string;
  // Stack of the original error instance
  stack: string;

  /* SYSTEM ERROR SPECIFICS */

  // Error number
  errno?: number;
  // System call name
  syscall?: string;
  // Extra details about the error
  info?: Record<string, any>;

  // Aditional info that could be helpful
  // to debug
  additionalInfo?: string;
};

export type AppIssue = {
  action: 'GET_DEVICE_NAME_ERROR';
  errorName: AppErrorName;
  process: 'GENERAL';
  errorDetails: {
    name: string;
    message: string;
    stack: string;
  };
};

type DriveOperationInProgress = {
  action: 'UPLOADING' | 'DOWNLOADING' | 'RENAMING' | 'DELETING';
  progress: number;
  name: string;
};
type DriveOperationCompleted = {
  action: 'UPLOADED' | 'DOWNLOADED' | 'RENAMED' | 'DELETED';
  name: string;
  progress: undefined; // Needed so ts does not complain with the union type
};

export type DriveInfo = DriveOperationInProgress | DriveOperationCompleted;

type SyncActionName =
  | 'renameInLocal'
  | 'renameInRemote'
  | 'pullFromLocal'
  | 'pullFromRemote'
  | 'deleteInLocal'
  | 'deleteInRemote';

type SyncAction = Array<[string, string]> | Array<string>;

export type EnqueuedSyncActions = Partial<Record<SyncActionName, SyncAction>>;
