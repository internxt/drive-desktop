import { ItemKind } from '../../shared/ItemKind';
import { Tuple } from '../utils/types';

export type Deltas = Record<string, Delta>;

export type Status =
  | 'NEW'
  | 'NEWER'
  | 'DELETED'
  | 'OLDER'
  | 'UNCHANGED'
  | 'NEW_NAME'
  | 'RENAMED'
  /**
   * When an item gets moved out of a folder or the parent folder it's renamed
   */
  | 'MOVED_OUT'
  /**
   * When an item gets moved in to a folder or the parent folder its the result of a rename
   */
  | 'MOVED_IN';

export class Delta {
  public readonly status: Status;

  public readonly itemKind: ItemKind;

  public readonly related: Tuple<string, Status> | undefined;

  constructor(
    status: Status,
    isFolder: boolean,
    related?: Tuple<string, Status>
  );
  constructor(
    status: Status,
    itemKind: ItemKind,
    related?: Tuple<string, Status>
  );
  constructor(
    ...args:
      | [Status, boolean, Tuple<string, Status>?]
      | [Status, ItemKind, Tuple<string, Status>?]
  ) {
    const [status, kind, related] = args;

    this.status = status;

    if (typeof kind === 'boolean') {
      this.itemKind = kind ? 'FOLDER' : 'FILE';
    } else {
      this.itemKind = kind;
    }

    this.related = related;
  }

  public is(status: Status): boolean {
    return this.status === status;
  }
}
