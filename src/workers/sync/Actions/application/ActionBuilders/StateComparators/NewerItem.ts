import { Delta } from '../../../../ItemState/domain/Delta';
import { ItemState } from '../../../../ItemState/domain/ItemState';
import { StateComparator } from './StateComparator';

export class NewerItem implements StateComparator {
	private static readonly canBeOverwritten: Array<Delta> = ['DELETED', 'UNCHANGED', 'OLDER'];

	constructor(private readonly state: ItemState) {}

	private canBeOverwrited(state: ItemState): boolean {
		return NewerItem.canBeOverwritten.some((delta) => state.is(delta));
	}

	compare(other: ItemState): boolean {
		return this.state.is('NEWER') && this.canBeOverwrited(other);
	}
}
