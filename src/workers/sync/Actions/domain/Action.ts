import { ItemKind } from '../../../../shared/ItemKind';
import { FileSystemKind } from '../../../types';

export type SyncTask = 'PULL' | 'RENAME' | 'DELETE';

export type Action<T extends ItemKind> = {
  fileSystem: FileSystemKind;
  name: string;
  task: SyncTask;
  kind: T;
};
