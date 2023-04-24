import Logger from 'electron-log';
import { itemIsInFolder } from '../utils/file-is-on-folder';
import {
  EnqueuedSyncActions,
  FileSystem,
  Listing as OldListing,
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
  LocalListing,
  RemoteListing,
  Listing,
} from './Listings/domain/Listing';
import { createErrorDetails } from '../utils/reporting';
import { listingsAreInSync } from './Listings/application/ListingsAreInSync';
import { joinPartialListings } from './Listings/application/JoinPartialListings';
import { createSynchronizedItemMetaDataFromPartials } from './Listings/application/JoinPartialMetaData';
import { convertActionsToQueues } from './Actions/application/ConvertActionsToQueues';
import { generateHierarchyActions } from './Actions/application/GenerateHierarchyActions';
import { PullFolderQueueConsumer } from '../filesystems/application/PullFolderQueueConsumer';
import { RenameFolderQueuConsumer } from '../filesystems/application/RenameFolderQueueConsumer';
import { DeleteFolderQueueConsumer } from '../filesystems/application/DeleteFolderQueueConsumer';
import { serializeListing } from './Listings/application/SerializeListing';
import { LocalItemMetaData } from './Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from './Listings/domain/RemoteItemMetaData';
import { generateResyncActions } from './Actions/application/ActionsGenerator';

class Sync extends Process {
  constructor(
    protected readonly local: SyncFileSystem<LocalListing>,
    protected readonly remote: SyncFileSystem<RemoteListing>,
    private readonly listingStore: ListingStore,
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

    Logger.debug('Last saved listing:', serializeListing(lastSavedListing));

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

    const actions = generateHierarchyActions(
      deltasLocal,
      deltasRemote,
      currentLocal,
      currentRemote
    );

    await this.listingStore.removeSavedListing();

    Logger.debug(JSON.stringify(actions, null, 2));

    const queues = convertActionsToQueues(actions);

    const {
      renameInLocal,
      renameInRemote,
      pullFromLocal,
      pullFromRemote,
      deleteInLocal,
      deleteInRemote,
    } = queues.file;

    this.emit('ACTION_QUEUE_GENERATED', {
      renameInLocal,
      renameInRemote,
      pullFromLocal,
      pullFromRemote,
      deleteInLocal,
      deleteInRemote,
    });

    await this.consumeFolderQueues(queues.folder);
    const {
      pullFromRemote: pullFoldersFromRemote,
      pullFromLocal: pullFoldersFromLocal,
    } = queues.folder;

    Logger.debug(
      'PULL FOLDERS: ',
      JSON.stringify(pullFoldersFromRemote, null, 2),
      JSON.stringify(pullFoldersFromLocal, null, 2)
    );

    const remoteFolderPullConsumer = new PullFolderQueueConsumer(
      this.local,
      this.remote,
      this
    );
    const localFolderPullConsumer = new PullFolderQueueConsumer(
      this.remote,
      this.local,
      this
    );

    await remoteFolderPullConsumer.consume(pullFoldersFromRemote);
    await localFolderPullConsumer.consume(pullFoldersFromLocal);

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

  async consumeFolderQueues(queues: {
    renameInLocal: any;
    renameInRemote: any;
    pullFromLocal: any;
    pullFromRemote: any;
    deleteInLocal: any;
    deleteInRemote: any;
  }) {
    const {
      pullFromRemote: pullFoldersFromRemote,
      pullFromLocal: pullFoldersFromLocal,
      renameInLocal: renameFolderInLocal,
      renameInRemote: renameFolderInRemote,
      deleteInLocal: deleteFolderInLocal,
      deleteInRemote: deleteFolderInRemote,
    } = queues;

    Logger.debug(
      'Delete folders: ',
      JSON.stringify({ remote: deleteFolderInRemote }, null, 2),
      JSON.stringify({ local: deleteFolderInLocal }, null, 2)
    );

    Logger.debug(
      'Pull folders: ',
      JSON.stringify({ remote: pullFoldersFromRemote }, null, 2),
      JSON.stringify({ local: pullFoldersFromLocal }, null, 2)
    );

    Logger.debug(
      'Rename folders: ',
      JSON.stringify({ remote: renameFolderInRemote }, null, 2),
      JSON.stringify({ local: renameFolderInLocal }, null, 2)
    );

    const remoteFolderRenameConsumer = new RenameFolderQueuConsumer(
      this.remote,
      this
    );
    const localFolderRenameConsumer = new RenameFolderQueuConsumer(
      this.local,
      this
    );

    const remoteConsumer = new PullFolderQueueConsumer(
      this.local,
      this.remote,
      this
    );
    const localConsumer = new PullFolderQueueConsumer(
      this.remote,
      this.local,
      this
    );

    const remoteFolderDeleteConsumer = new DeleteFolderQueueConsumer(
      this.remote,
      this
    );
    const localFolderDeleteConsumer = new DeleteFolderQueueConsumer(
      this.local,
      this
    );

    await remoteFolderRenameConsumer.consume(renameFolderInRemote);
    await localFolderRenameConsumer.consume(renameFolderInLocal);

    await remoteConsumer.consume(pullFoldersFromRemote);
    await localConsumer.consume(pullFoldersFromLocal);

    await remoteFolderDeleteConsumer.consume(deleteFolderInRemote);
    await localFolderDeleteConsumer.consume(deleteFolderInLocal);
  }

  private async resync(): Promise<ProcessResult> {
    this.emit('NEEDS_RESYNC');

    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: true,
    });

    Logger.debug('Current local before', currentLocal);
    Logger.debug('Current remote before', currentRemote);

    const localDeltas = generateDeltas({}, currentLocal);
    const remoteDeltas = generateDeltas({}, currentRemote);

    const actions = generateResyncActions(
      localDeltas,
      remoteDeltas,
      currentLocal,
      currentRemote
    );

    const queues = convertActionsToQueues(actions);
    const {
      pullFromRemote: pullFoldersFromRemote,
      pullFromLocal: pullFoldersFromLocal,
    } = queues.folder;

    Logger.debug(
      'PULL FOLDERS: ',
      JSON.stringify(pullFoldersFromRemote, null, 2),
      JSON.stringify(pullFoldersFromLocal, null, 2)
    );

    await this.consumeFolderQueues(queues.folder);

    const {
      pullFromLocal: pullFilesFromLocal,
      pullFromRemote: pullFilesFromRemote,
    } = queues.file;

    Logger.debug('Queue pull from local', pullFilesFromLocal);
    Logger.debug('Queue pull from remote', pullFilesFromRemote);

    await Promise.all([
      this.consumePullQueue(pullFilesFromLocal, this.local, this.remote),
      this.consumePullQueue(pullFilesFromRemote, this.remote, this.local),
    ]);

    return this.finalize();
  }

  private async listDeletedFolders(
    saved: OldListing,
    current: OldListing,
    filesystem: Pick<FileSystem, 'existsFolder'>
  ): Promise<string[]> {
    function getFoldersInListing(listing: OldListing): Set<string> {
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

  async generateResult2(): Promise<
    | (SuccessfulProcessResult & { listing: Listing })
    | {
        status: 'NOT_IN_SYNC';
        diff: {
          itemsNotInLocal: RemoteItemMetaData[];
          itemsNotInRemote: LocalItemMetaData[];
          filesWithDifferentModtime: string[];
          filesInSync: Listing;
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

      // const diff = this.getListingsDiff(currentLocal, currentRemote);
      const newDiff = this.getNewListingsDiff(currentLocal, currentRemote);

      return { status: 'NOT_IN_SYNC', diff: newDiff };
    }
  }

  getNewListingsDiff(
    local: LocalListing,
    remote: RemoteListing
  ): {
    itemsNotInLocal: RemoteItemMetaData[];
    itemsNotInRemote: LocalItemMetaData[];
    filesWithDifferentModtime: string[];
    filesInSync: Listing;
  } {
    const itemsNotInLocal = [];
    const itemsNotInRemote = [];
    const filesWithDifferentModtime = [];
    const filesInSync: Listing = {};

    for (const [localName, localMetadata] of Object.entries(local)) {
      const remoteMetadata = remote[localName];

      if (!remoteMetadata) {
        itemsNotInRemote.push(localMetadata);
      } else if (localMetadata.modtime !== remoteMetadata.modtime) {
        filesWithDifferentModtime.push(localName);
      } else {
        filesInSync[localName] = createSynchronizedItemMetaDataFromPartials(
          local[localName],
          remote[localName]
        );
      }
    }

    for (const [remoteName, remoteMetadata] of Object.entries(remote)) {
      if (!(remoteName in local)) {
        itemsNotInLocal.push(remoteMetadata);
      }
    }

    return {
      itemsNotInLocal,
      itemsNotInRemote,
      filesWithDifferentModtime,
      filesInSync,
    };
  }

  private async finalize(): Promise<ProcessResult> {
    this.emit('FINALIZING');

    const result = await this.generateResult2();

    if (result.status === 'IN_SYNC') {
      // await this.listingStore.saveListing(result.listing);
      const { listing, ...rest } = result;
      return rest;
    } else {
      await this.listingStore.saveListing(result.diff.filesInSync);
      return await this.generateResult();
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
