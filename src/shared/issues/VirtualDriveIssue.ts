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
