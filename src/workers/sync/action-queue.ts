import { NewName, OldName } from '../utils/change-is-rename';
import { Tuple } from '../utils/types';
import { FileName, FileSystemKind } from '../types';
import { ItemKind } from '../../shared/ItemKind';

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
  public queues: Queue<T>;

  constructor() {
    this.queues = {
      LOCAL: {
        FILE: [],
        FOLDER: [],
      },
      REMOTE: {
        FILE: [],
        FOLDER: [],
      },
    };
  }

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

  public getAll = () => {
    return [
      ...this.queues.LOCAL.FILE,
      ...this.queues.REMOTE.FILE,
      ...this.queues.LOCAL.FOLDER,
      ...this.queues.REMOTE.FOLDER,
    ];
  };
}

export class DeleteQueue extends ActionQueue<FileName> {}

export class PullQueue extends ActionQueue<FileName> {
  public add = (
    fileSystem: FileSystemKind,
    itemKind: ItemKind,
    item: FileName
  ): void => {
    if (itemKind === 'FOLDER') {
      // At the moment the folder creation is controlled on the file creation
      return;
    }

    this.queues[fileSystem][itemKind].push(item);
  };
}

export class RenameQueue extends ActionQueue<Tuple<OldName, NewName>> {}

export type Queues = {
  pull: PullQueue;
  delete: DeleteQueue;
  rename: RenameQueue;
};
