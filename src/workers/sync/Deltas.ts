import { ItemKind } from '../types';

export type Deltas = Record<string, Delta>;

export type Status =
  | 'NEW'
  | 'NEWER'
  | 'DELETED'
  | 'OLDER'
  | 'UNCHANGED'
  | 'NEW_NAME'
  | 'RENAMED';

export class Delta {
  public readonly status: Status;

  public readonly itemKind: ItemKind;

  constructor(status: Status, isFolder: boolean);
  constructor(status: Status, itemKind: ItemKind);
  constructor(...args: [Status, boolean] | [Status, ItemKind]) {
    const [status, kind] = args;

    this.status = status;

    if (typeof kind === 'boolean') {
      this.itemKind = kind ? 'FOLDER' : 'FILE';
    } else {
      this.itemKind = kind;
    }
  }

  public is(status: Status): boolean {
    return this.status === status;
  }
}
