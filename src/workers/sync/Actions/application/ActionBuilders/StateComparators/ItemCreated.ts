import { Nullable } from '../../../../../../shared/types/Nullable';
import { ItemState } from '../../../../ItemState/domain/ItemState';
import { StateComparator } from './StateComparator';

export class ItemCreated implements StateComparator {
	constructor(private readonly state: ItemState) {}

	compare(other: Nullable<ItemState>): boolean {
		return this.state.is('NEW') && other === undefined;
	}
}
