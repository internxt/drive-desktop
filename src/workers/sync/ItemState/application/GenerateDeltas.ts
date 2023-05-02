import { Listing, PartialListing } from '../../Listings/domain/Listing';
import { ItemDeltas } from '../domain/ItemDelta';
import { ItemState } from '../domain/ItemState';

export function generateDeltas(saved: Listing, current: PartialListing): ItemDeltas {
	const deltas: ItemDeltas = {};

	for (const [name, meta] of Object.entries(current)) {
		const savedEntry = saved[name];

		if (!savedEntry) {
			deltas[name] = new ItemState('NEW');
		} else if (savedEntry.modtime === meta.modtime) {
			deltas[name] = new ItemState('UNCHANGED');
		} else if (savedEntry.modtime < meta.modtime) {
			deltas[name] = new ItemState('NEWER');
		} else {
			deltas[name] = new ItemState('OLDER');
		}
	}

	for (const [name] of Object.entries(saved)) {
		if (!(name in current)) {
			deltas[name] = new ItemState('DELETED');
		}
	}

	return deltas;
}
