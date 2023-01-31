import { FileSystemKind } from '../../../types';

export type SyncTask = 'PULL' | 'RENAME' | 'DELETE';

export type Action = {
  fileSystem: FileSystemKind;
  name: string;
  task: SyncTask;
};
