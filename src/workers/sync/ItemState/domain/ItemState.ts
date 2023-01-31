// import { ItemKind } from '../../../../shared/ItemKind';
// import { Tuple } from '../../../utils/types/Tuple';
import { Delta } from './Delta';

export class ItemState {
  constructor(
    // private related?: Tuple<string, Delta>
    // private itemKind: ItemKind,
    private delta: Delta
  ) {}

  public is(delta: Delta): boolean {
    return this.delta === delta;
  }
}
