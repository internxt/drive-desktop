import { LocalListing, RemoteListing } from '../../Listings/domain/Listing';
import { FileDeltas } from '../../ItemState/domain/FileDelta';
import { Action } from '../domain/Action';
import { Nullable } from '../../../../shared/types/Nullable';
import { ActionBuilder } from '../domain/ActionBuilder';
import { PullActionBuilderCreator } from './ActionBuilders/PullActioBuilderCreator';
import { KeepMostRecentActionBuilderCreator } from './ActionBuilders/KeepMostRecentActionBuilderCreator';
import { DeleteActionBuilderCreator } from './ActionBuilders/DeleteActionBuilderCreator';

export function generateActions(
  deltasLocal: FileDeltas,
  deltasRemote: FileDeltas,
  currentLocalListing: LocalListing,
  currentRemoteListing: RemoteListing
) {
  const actions: Array<Action> = [];

  const pushIfDefined = (
    actionBuilder: Nullable<ActionBuilder>,
    pathLike: string
  ) => {
    if (actionBuilder) actions.push(actionBuilder(pathLike));
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
      ).create(),
      name
    );

    pushIfDefined(
      new DeleteActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing },
        'REMOTE'
      ).create(),
      name
    );

    pushIfDefined(
      new KeepMostRecentActionBuilderCreator(
        { state: deltaLocal, listing: localListing },
        { state: deltaRemote, listing: remoteListing }
      ).create(),
      name
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
      ).create(),
      name
    );

    pushIfDefined(
      new DeleteActionBuilderCreator(
        { state: deltaRemote, listing: remoteListing },
        { state: deltaLocal, listing: localListing },
        'LOCAL'
      ).create(),
      name
    );
  }

  return actions;
}
