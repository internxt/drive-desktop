import { ItemState } from '../../../../ItemState/domain/ItemState';
import { StateComparator } from './StateComparator';

export class ItemOutdated implements StateComparator {
	constructor(private readonly state: ItemState) {}

	compare(other: ItemState): boolean {
		return this.state.is('OLDER') && (other.is('DELETED') || other.is('UNCHANGED'));
	}
}
