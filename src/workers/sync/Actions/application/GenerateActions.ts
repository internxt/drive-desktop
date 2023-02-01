import { LocalListing, RemoteListing } from '../../Listings/domain/Listing';
import { ItemDeltas } from '../../ItemState/domain/FileDelta';
import { Action } from '../domain/Action';
import { Nullable } from '../../../../shared/types/Nullable';
import { PullActionBuilderCreator } from './ActionBuilders/PullActioBuilderCreator';
import { KeepMostRecentActionBuilderCreator } from './ActionBuilders/KeepMostRecentActionBuilderCreator';
import { DeleteActionBuilderCreator } from './ActionBuilders/DeleteActionBuilderCreator';

export function generateActions(
  deltasLocal: ItemDeltas,
  deltasRemote: ItemDeltas,
  currentLocalListing: LocalListing,
  currentRemoteListing: RemoteListing
) {
  const actions: Array<Action> = [];

  const pushIfDefined = (action: Nullable<Action>) => {
    if (action) actions.push(action);
  };

  for (const [name, deltaLocal] of Object.entries(deltasLocal)) {
    const deltaRemote = deltasRemote[name];
    const localListing = currentLocalListing[name];
    const remoteListing = currentRemoteListing[name];

    pushIfDefined(
      new PullActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ).create(name)
    );

    pushIfDefined(
      new DeleteActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ).create(name)
    );

    pushIfDefined(
      new KeepMostRecentActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing }
      ).create(name)
    );
  }

  for (const [name, deltaRemote] of Object.entries(deltasRemote)) {
    const deltaLocal = deltasLocal[name];
    const localListing = currentLocalListing[name];
    const remoteListing = currentRemoteListing[name];

    pushIfDefined(
      new PullActionBuilderCreator(
        { state: deltaRemote, listing: remoteListing },
        { state: deltaLocal, listing: localListing },
        'LOCAL'
      ).create(name)
    );

    pushIfDefined(
      new DeleteActionBuilderCreator(
        { state: deltaRemote, listing: remoteListing },
        { state: deltaLocal, listing: localListing },
        'LOCAL'
      ).create(name)
    );
  }

  return actions;
}
