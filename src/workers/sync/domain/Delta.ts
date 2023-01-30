import { ItemKind } from '../../../shared/ItemKind';
import { Tuple } from '../../utils/types/Tuple';

export type FileDeltas = Record<string, ItemState>;

type Delta = 'NEW' | 'NEWER' | 'DELETED' | 'OLDER' | 'UNCHANGED';

export class ItemState {
  constructor(
    private delta: Delta,
    private itemKind: ItemKind,
    private related?: Tuple<string, Delta>
  ) {}

  public is(delta: Delta): boolean {
    return this.delta === delta;
  }
}
