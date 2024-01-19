import { ProcessErrorName } from '../../apps/shared/types';

export type VirtualDriveIssue = {
  action:
    | 'UPLOAD_ERROR'
    | 'DOWNLOAD_ERROR'
    | 'RENAME_ERROR'
    | 'DELETE_ERROR'
    | 'METADATA_READ_ERROR'
    | 'GENERATE_TREE';
  node: string;
  errorName: ProcessErrorName;
};

export type ProcessFatalErrorName =
  | 'NO_INTERNET'
  | 'NO_REMOTE_CONNECTION'
  | 'CANNOT_ACCESS_BASE_DIRECTORY'
  | 'BASE_DIRECTORY_DOES_NOT_EXIST'
  | 'INSUFFICIENT_PERMISSION_ACCESSING_BASE_DIRECTORY'
  | 'CANNOT_ACCESS_TMP_DIRECTORY'
  | 'CANNOT_GET_CURRENT_LISTINGS'
  | 'UNKNOWN';
