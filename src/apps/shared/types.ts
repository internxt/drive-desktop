const actionsInProgress = ['UPLOADING', 'DOWNLOADING'] as const;

type ActionWithProgress = (typeof actionsInProgress)[number];

type DriveOperationWithProgress = {
  action: ActionWithProgress;
  progress: number;
  oldName: string;
  name: string;
};

const actions = [
  'RENAMING',
  'DELETING',
  'UPLOADED',
  'DOWNLOADED',
  'RENAMED',
  'DELETED',
  'RENAMING_FOLDER',
  'CREATING_FOLDER',
  'FOLDER_RENAMED',
  'FOLDER_CREATED',
] as const;

type Action = (typeof actions)[number];

type DriveOperation = {
  action: Action;
  name: string;
  oldName: string | undefined;
  progress: undefined; // Needed so ts does not complain with the union type
};

export type DriveOperationInfo = DriveOperationWithProgress | DriveOperation;

export type DriveAction = Action | ActionWithProgress;
