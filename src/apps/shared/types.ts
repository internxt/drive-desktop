import { AppErrorName } from '../../shared/issues/AppIssue';

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
