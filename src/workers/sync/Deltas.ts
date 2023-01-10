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
  constructor(
    public readonly status: Status,
    public readonly itemKind: ItemKind = 'FILE'
  ) {}

  public is(status: Status): boolean {
    return this.status === status;
  }
}
