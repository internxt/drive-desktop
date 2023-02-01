import { LocalListing, RemoteListing } from '../../Listings/domain/Listing';
import { ItemDeltas } from '../../ItemState/domain/FileDelta';
import { Action } from '../domain/Action';
import { Nullable } from '../../../../shared/types/Nullable';
import { PullActionBuilder } from './ActionBuilders/PullActioBuilder';
import { KeepMostRecentActionBuilder } from './ActionBuilders/KeepMostRecentActionBuilder';
import { DeleteActionBuilder } from './ActionBuilders/DeleteActionBuilder';

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
      new PullActionBuilder(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ).create(name)
    );

    pushIfDefined(
      new DeleteActionBuilder(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ).create(name)
    );

    pushIfDefined(
      new KeepMostRecentActionBuilder(
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
      new PullActionBuilder(
        { state: deltaRemote, listing: remoteListing },
        { state: deltaLocal, listing: localListing },
        'LOCAL'
      ).create(name)
    );

    pushIfDefined(
      new DeleteActionBuilder(
        { state: deltaRemote, listing: remoteListing },
        { state: deltaLocal, listing: localListing },
        'LOCAL'
      ).create(name)
    );
  }

  return actions;
}
