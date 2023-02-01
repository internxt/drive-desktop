import { LocalListing, RemoteListing } from '../../Listings/domain/Listing';
import { ItemDeltas } from '../../ItemState/domain/FileDelta';
import { Action } from '../domain/Action';
import { Nullable } from '../../../../shared/types/Nullable';
import { PullActionBuilderCreator } from './ActionBuilders/PullActioBuilderCreator';
import { KeepMostRecentActionBuilderCreator } from './ActionBuilders/KeepMostRecentActionBuilderCreator';
import { DeleteActionBuilderCreator } from './ActionBuilders/DeleteActionBuilderCreator';
import { ActionBuilder } from '../domain/ActionBuilderCreator';

function buildFirst(
  builders: Array<ActionBuilder>,
  path: string
): Nullable<Action> {
  for (const builder of builders) {
    const action = builder.create(path);

    if (action) return action;
  }

  return undefined;
}

export function generateHierarchyActions(
  deltasLocal: ItemDeltas,
  deltasRemote: ItemDeltas,
  currentLocalListing: LocalListing,
  currentRemoteListing: RemoteListing
): Array<Action> {
  const actions: Array<Action> = [];

  const pushIfDefined = (action: Nullable<Action>) => {
    if (action) actions.push(action);
  };

  for (const [name, deltaLocal] of Object.entries(deltasLocal)) {
    const deltaRemote = deltasRemote[name];
    const localListing = currentLocalListing[name];
    const remoteListing = currentRemoteListing[name];

    const builders = [
      new PullActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ),
      new DeleteActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ),
      new KeepMostRecentActionBuilderCreator(
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
      new PullActionBuilderCreator(
        { state: deltaRemote, listing: remoteListing },
        { state: deltaLocal, listing: localListing },
        'LOCAL'
      ),
      new DeleteActionBuilderCreator(
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
