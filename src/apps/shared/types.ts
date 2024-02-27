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
