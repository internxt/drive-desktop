import { Nullable } from '../../../../../../shared/types/Nullable';
import { ItemState } from '../../../../ItemState/domain/ItemState';

export interface StateComparator {
	compare(other: Nullable<ItemState>): boolean;
}
