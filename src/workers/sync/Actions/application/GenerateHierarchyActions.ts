import { ItemKind } from '../../../../shared/ItemKind';
import { Nullable } from '../../../../shared/types/Nullable';
import { ItemDeltas } from '../../ItemState/domain/ItemDelta';
import { LocalListing, RemoteListing } from '../../Listings/domain/Listing';
import { Action } from '../domain/Action';
import { ActionBuilder } from '../domain/ActionBuilderCreator';
import { DeleteActionBuilder } from './ActionBuilders/DeleteActionBuilder';
import { KeepMostRecentActionBuilder } from './ActionBuilders/KeepMostRecentActionBuilder';
import { PullActionBuilder } from './ActionBuilders/PullActioBuilder';

function buildFirst(builders: Array<ActionBuilder>, path: string): Nullable<Action<ItemKind>> {
	for (const builder of builders) {
		const action = builder.create(path);

		if (action) {
			return action;
		}
	}

	return undefined;
}

export function generateHierarchyActions(
	deltasLocal: ItemDeltas,
	deltasRemote: ItemDeltas,
	currentLocalListing: LocalListing,
	currentRemoteListing: RemoteListing
): Array<Action<ItemKind>> {
	const actions: Array<Action<ItemKind>> = [];

	const pushIfDefined = (action: Nullable<Action<ItemKind>>) => {
		if (action) {
			actions.push(action);
		}
	};

	for (const [name, deltaLocal] of Object.entries(deltasLocal)) {
		const deltaRemote = deltasRemote[name];
		const localListing = currentLocalListing[name];
		const remoteListing = currentRemoteListing[name];

		const builders = [
			new PullActionBuilder(
				{ state: deltaLocal, listing: localListing },
				{ state: deltaRemote, listing: remoteListing },
				'REMOTE'
			),
			new DeleteActionBuilder(
				{ state: deltaLocal, listing: localListing },
				{ state: deltaRemote, listing: remoteListing },
				'REMOTE'
			),
			new KeepMostRecentActionBuilder(
				{ state: deltaLocal, listing: localListing },
				{ state: deltaRemote, listing: remoteListing }
			),
		];

		const action = buildFirst(builders, name);

		pushIfDefined(action);
	}

	for (const [name, deltaRemote] of Object.entries(deltasRemote)) {
		const deltaLocal = deltasLocal[name];
		const localListing = currentLocalListing[name];
		const remoteListing = currentRemoteListing[name];

		const builders = [
			new PullActionBuilder(
				{ state: deltaRemote, listing: remoteListing },
				{ state: deltaLocal, listing: localListing },
				'LOCAL'
			),
			new DeleteActionBuilder(
				{ state: deltaRemote, listing: remoteListing },
				{ state: deltaLocal, listing: localListing },
				'LOCAL'
			),
		];

		const action = buildFirst(builders, name);

		pushIfDefined(action);
	}

	return actions;
}
