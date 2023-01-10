import { NewName, OldName } from '../utils/change-is-rename';
import { Tuple } from '../utils/types';
import { FileName, FileSystemKind, ItemKind } from '../types';

// type Action = 'PULL' | 'DELETE' | 'RENAME';

type Queue<T> = Record<FileSystemKind, Record<ItemKind, T[]>>;

const defult = {
  LOCAL: {
    FILE: [],
    FOLDER: [],
  },
  REMOTE: {
    FILE: [],
    FOLDER: [],
  },
};

export abstract class ActionQueue<T> {
  public queues: Queue<T> = {
    LOCAL: {
      FILE: [],
      FOLDER: [],
    },
    REMOTE: {
      FILE: [],
      FOLDER: [],
    },
  };

  public add = (
    fileSystem: FileSystemKind,
    itemKind: ItemKind,
    item: T
  ): void => {
    this.queues[fileSystem][itemKind].push(item);
  };

  public empty = () => {
    this.queues = defult;
  };

  public get = (fileSystem: FileSystemKind, itemKind: ItemKind) => {
    return this.queues[fileSystem][itemKind];
  };
}

export class DeleteQueue extends ActionQueue<FileName> {}
export class PullQueue extends ActionQueue<FileName> {}

export class RenameQueue extends ActionQueue<Tuple<OldName, NewName>> {}

export type Queues = {
  PULL: PullQueue;
  DELETE: DeleteQueue;
  RENAME: RenameQueue;
};
