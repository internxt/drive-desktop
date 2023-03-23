import { Nullable } from 'shared/types/Nullable';
import { Delta } from './Delta';

type AssociateStateDelta = 'RENAMED' | 'RENAME_RESULT';

export class ItemState {
  constructor(
    private delta: Delta,
    private associateState?: { name: string; delta: AssociateStateDelta }
  ) {}

  public is(delta: Delta): boolean {
    return this.delta === delta;
  }

  public hasAssociateStateWithDelta(associateDelta: AssociateStateDelta) {
    if (!this.associateState) return false;

    return this.associateState.delta === associateDelta;
  }

  public associateItemName(): Nullable<string> {
    if (!this.associateState) return;

    return this.associateState.name;
  }
}
