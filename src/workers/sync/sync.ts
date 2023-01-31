import Logger from 'electron-log';
import { itemIsInFolder } from '../utils/file-is-on-folder';
import {
  EnqueuedSyncActions,
  FileSystem,
  Listing,
  ProcessError,
  ProcessFatalError,
} from '../types';
import { FileSystem as SyncFileSystem } from '../filesystems/domain/FileSystem';
import Process, {
  ProcessEvents,
  ProcessResult,
  SuccessfulProcessResult,
} from '../process';
import { generateDeltas } from './ItemState/application/GenerateDeltas';
import { ListingStore } from './Listings/domain/ListingStore';
import {
  Listing as NewListing,
  LocalListing,
  RemoteListing,
} from './Listings/domain/Listing';
import { createErrorDetails } from '../utils/reporting';
import { Nullable } from '../../shared/types/Nullable';
import { ActionBuilder } from './Actions/domain/ActionBuilder';
import { Action } from './Actions/domain/Action';
import { PullActionBuilderCreator } from './Actions/application/ActionBuilders/PullActioBuilderCreator';
import { FileDeltas } from './ItemState/domain/FileDelta';
import { KeepMostRecentActionBuilderCreator } from './Actions/application/ActionBuilders/KeepMostRecentActionBuilderCreator';
import { DeleteActionBuilderCreator } from './Actions/application/ActionBuilders/DeleteActionBuilderCreator';
import { listingsAreInSync } from './Listings/application/ListingsAreInSync';
import { joinPartialListings } from './Listings/application/JoinPartialListings';
import { createSynchronizedItemMetaDataFromPartials } from './Listings/application/JoinPartialMetaData';
import { convertActionsToQeues } from './Actions/application/ConvertActionsToQeues';

class Sync extends Process {
  constructor(
    protected readonly local: SyncFileSystem<LocalListing>,
    protected readonly remote: SyncFileSystem<RemoteListing>,
    private readonly listingStore: ListingStore
  ) {
    super(local, remote);
  }

  async getCurrentListings(options: { emitErrors: boolean }): Promise<{
    currentLocal: LocalListing;
    currentRemote: RemoteListing;
  }> {
    try {
      const [localResult, remoteResult] = await Promise.all([
        this.local.getCurrentListing(),
        this.remote.getCurrentListing(),
      ]);

      if (options.emitErrors) {
        this.emitReadingMetaErrors(localResult.readingMetaErrors, 'LOCAL');
        this.emitReadingMetaErrors(remoteResult.readingMetaErrors, 'REMOTE');
      }

      return {
        currentLocal: localResult.listing,
        currentRemote: remoteResult.listing,
      };
    } catch (err) {
      const syncError =
        err instanceof ProcessError
          ? new ProcessFatalError('CANNOT_GET_CURRENT_LISTINGS', err.details)
          : new ProcessFatalError(
              'CANNOT_GET_CURRENT_LISTINGS',
              createErrorDetails(err, 'Getting current listings')
            );

      throw syncError;
    }
  }

  async run(): Promise<ProcessResult> {
    this.emit('SMOKE_TESTING');

    await this.local.smokeTest();
    await this.remote.smokeTest();

    this.emit('CHECKING_LAST_RUN_OUTCOME');
    const lastSavedListing = await this.listingStore.getLastSavedListing();

    Logger.debug('Last saved listing:', lastSavedListing);

    if (!lastSavedListing) return this.resync();

    this.emit('GENERATING_ACTIONS_NEEDED_TO_SYNC');

    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: true,
    });

    Logger.debug('Current local before', currentLocal);
    Logger.debug('Current remote before', currentRemote);

    const deltasLocal = generateDeltas(lastSavedListing, currentLocal);
    const deltasRemote = generateDeltas(lastSavedListing, currentRemote);

    Logger.debug('Local deltas', deltasLocal);
    Logger.debug('Remote deltas', deltasRemote);

    const actions = this.generateActionQueues(
      deltasLocal,
      deltasRemote,
      currentLocal,
      currentRemote
    );

    await this.listingStore.removeSavedListing();

    const {
      renameInLocal,
      renameInRemote,
      pullFromLocal,
      pullFromRemote,
      deleteInLocal,
      deleteInRemote,
    } = convertActionsToQeues(actions);

    this.emit('ACTION_QUEUE_GENERATED', {
      renameInLocal,
      renameInRemote,
      pullFromLocal,
      pullFromRemote,
      deleteInLocal,
      deleteInRemote,
    });

    Logger.debug('Queue rename in local', renameInLocal);
    Logger.debug('Queue rename in remote', renameInRemote);
    Logger.debug('Queue pull from local', pullFromLocal);
    Logger.debug('Queue pull from remote', pullFromRemote);
    Logger.debug('Queue delete from local', deleteInLocal);

    await Promise.all([
      this.consumeRenameQueue(renameInLocal, this.local),
      this.consumeRenameQueue(renameInRemote, this.remote),
    ]);
    await Promise.all([
      this.consumePullQueue(pullFromLocal, this.local, this.remote),
      this.consumePullQueue(pullFromRemote, this.remote, this.local),
    ]);

    const foldersDeletedInLocal = await this.listDeletedFolders(
      lastSavedListing,
      currentLocal,
      this.local
    );

    const itemIsInDeletedFolder = itemIsInFolder(foldersDeletedInLocal);
    const deleteInRemoteNotIncludedOnFolderDeletion = deleteInRemote.filter(
      (fileName: string) => !itemIsInDeletedFolder(fileName)
    );

    Logger.debug(
      'Queue delete from remote',
      deleteInRemoteNotIncludedOnFolderDeletion
    );

    await Promise.all([
      this.consumeDeleteQueue(deleteInLocal, this.local),
      this.consumeDeleteQueue(
        deleteInRemoteNotIncludedOnFolderDeletion,
        this.remote
      ),
    ]);

    const foldersDeletedInRemote = await this.listDeletedFolders(
      lastSavedListing,
      currentRemote,
      this.remote
    );

    const deletedRootFoldersInLocal = foldersDeletedInLocal.filter(
      (folderName: string) => !itemIsInDeletedFolder(folderName)
    );

    Logger.log('Folders deleted in local', foldersDeletedInLocal);
    Logger.log('Folders deleted in remote', foldersDeletedInRemote);

    await Promise.all([
      this.consumeDeleteFolderQueue(foldersDeletedInRemote, this.local),
      this.consumeDeleteFolderQueue(deletedRootFoldersInLocal, this.remote),
    ]);

    return this.finalize();
  }

  private async resync(): Promise<ProcessResult> {
    this.emit('NEEDS_RESYNC');

    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: true,
    });

    Logger.debug('Current local before', currentLocal);
    Logger.debug('Current remote before', currentRemote);

    const {
      filesNotInLocal: pullFromLocal,
      filesNotInRemote: pullFromRemote,
      filesWithDifferentModtime,
    } = this.getListingsDiff(currentLocal, currentRemote);

    for (const name of filesWithDifferentModtime) {
      const { modtime: modtimeInLocal } = currentLocal[name];
      const { modtime: modtimeInRemote } = currentRemote[name];

      if (modtimeInLocal < modtimeInRemote) pullFromLocal.push(name);
      else pullFromRemote.push(name);
    }

    Logger.debug('Queue pull from local', pullFromLocal);
    Logger.debug('Queue pull from remote', pullFromRemote);

    this.emit('ACTION_QUEUE_GENERATED', {
      pullFromLocal,
      pullFromRemote,
    });

    await Promise.all([
      this.consumePullQueue(pullFromLocal, this.local, this.remote),
      this.consumePullQueue(pullFromRemote, this.remote, this.local),
    ]);

    return this.finalize();
  }

  private generateActionQueues(
    deltasLocal: FileDeltas,
    deltasRemote: FileDeltas,
    currentLocalListing: LocalListing,
    currentRemoteListing: RemoteListing
  ): Array<Action> {
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
          'LOCAL'
        ).create(),
        name
      );

      pushIfDefined(
        new DeleteActionBuilderCreator(
          { state: deltaLocal, listing: localListing },
          { state: deltaRemote, listing: remoteListing },
          'LOCAL'
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
          'REMOTE'
        ).create(),
        name
      );

      pushIfDefined(
        new DeleteActionBuilderCreator(
          { state: deltaRemote, listing: remoteListing },
          { state: deltaLocal, listing: localListing },
          'REMOTE'
        ).create(),
        name
      );
    }

    return actions;
  }

  private async listDeletedFolders(
    saved: Listing,
    current: Listing,
    filesystem: Pick<FileSystem, 'existsFolder'>
  ): Promise<string[]> {
    function getFoldersInListing(listing: Listing): Set<string> {
      const setOfFolders = new Set<string>();
      for (const fileName of Object.keys(listing)) {
        const names = fileName.split('/');
        names.pop();

        for (let i = 0; i < names.length; i++) {
          const routeToThisPoint = names.slice(0, i + 1).join('/');

          setOfFolders.add(routeToThisPoint);
        }
      }
      return setOfFolders;
    }

    const foldersInSaved = getFoldersInListing(saved);
    const foldersInCurrent = getFoldersInListing(current);

    const difference = [...foldersInSaved].filter(
      (folder) => !foldersInCurrent.has(folder)
    );

    const toReturn = [];

    for (const folder of difference) {
      const existsInFilesystem = await filesystem.existsFolder(folder);

      if (!existsInFilesystem) toReturn.push(folder);
    }

    return toReturn;
  }

  async generateResult(): Promise<
    | (SuccessfulProcessResult & { listing: NewListing })
    | {
        status: 'NOT_IN_SYNC';
        diff: {
          filesNotInLocal: string[];
          filesNotInRemote: string[];
          filesWithDifferentModtime: string[];
          filesInSync: NewListing;
        };
      }
  > {
    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: false,
    });

    if (listingsAreInSync(currentLocal, currentRemote)) {
      const currentInBoth = currentLocal;
      Logger.debug('Current in both:', currentInBoth);

      const listing = joinPartialListings(currentLocal, currentRemote);

      return { status: 'IN_SYNC', listing };
    } else {
      Logger.debug('Current local:', currentLocal);
      Logger.debug('Current remote:', currentRemote);

      const diff = this.getListingsDiff(currentLocal, currentRemote);

      return { status: 'NOT_IN_SYNC', diff };
    }
  }

  getListingsDiff(
    local: LocalListing,
    remote: RemoteListing
  ): {
    filesNotInLocal: string[];
    filesNotInRemote: string[];
    filesWithDifferentModtime: string[];
    filesInSync: NewListing;
  } {
    const filesNotInLocal = [];
    const filesNotInRemote = [];
    const filesWithDifferentModtime = [];
    const filesInSync: NewListing = {};

    for (const [localName, { modtime: localModtime }] of Object.entries(
      local
    )) {
      const entryInRemote = remote[localName];

      if (!entryInRemote) {
        filesNotInRemote.push(localName);
      } else if (localModtime !== entryInRemote.modtime) {
        filesWithDifferentModtime.push(localName);
      } else {
        filesInSync[localName] = createSynchronizedItemMetaDataFromPartials(
          local[localName],
          remote[localName]
        );
      }
    }

    for (const remoteName of Object.keys(remote)) {
      if (!(remoteName in local)) {
        filesNotInLocal.push(remoteName);
      }
    }

    return {
      filesNotInLocal,
      filesNotInRemote,
      filesWithDifferentModtime,
      filesInSync,
    };
  }

  private async finalize(): Promise<ProcessResult> {
    this.emit('FINALIZING');

    const result = await this.generateResult();

    if (result.status === 'IN_SYNC') {
      await this.listingStore.saveListing(result.listing);
      const { listing, ...rest } = result;
      return rest;
    } else {
      await this.listingStore.saveListing(result.diff.filesInSync);
      return result;
    }
  }
}

interface SyncEvents extends ProcessEvents {
  /**
   * Triggered when the process tries to gather
   * information about the outcome of the last run
   */
  CHECKING_LAST_RUN_OUTCOME: () => void;
  /**
   * Triggered when the process has not enough information
   * to do a default sync, because either something went wrong
   * in the last run or because it is the first one
   */
  NEEDS_RESYNC: () => void;

  /**
   * Triggered when the actions needed to sync the remote and
   * local systems have been successfully calculated
   */
  ACTION_QUEUE_GENERATED: (files: EnqueuedSyncActions) => void;

  /**
   * Triggered when the changes needed to be in sync
   * have been made (either by a default run or a resync)
   * and new listings will be generated and saved if the
   * filesystems are in sync
   */
  FINALIZING: () => void;
}

/**
 * Enable event typing
 */
declare interface Sync {
  on<U extends keyof SyncEvents>(event: U, listener: SyncEvents[U]): this;

  emit<U extends keyof SyncEvents>(
    event: U,
    ...args: Parameters<SyncEvents[U]>
  ): boolean;
}

export default Sync;
