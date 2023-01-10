import Logger from 'electron-log';
import { EnqueuedSyncActions, FileSystem, ItemKind, Listing } from '../types';
import Process, { ProcessEvents, ProcessResult } from '../process';
import { generateRenameDeltas } from '../utils/change-is-rename';
import { Delta, Deltas } from './Deltas';
import { DeleteQueue, PullQueue, Queues, RenameQueue } from './action-queue';

class Sync extends Process {
  constructor(
    protected readonly local: FileSystem,
    protected readonly remote: FileSystem,
    private readonly listingStore: ListingStore
  ) {
    super(local, remote);
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

    const deltasLocal = this.generateDeltas(lastSavedListing, currentLocal);
    const deltasRemote = this.generateDeltas(lastSavedListing, currentRemote);

    Logger.debug('Local deltas', deltasLocal);
    Logger.debug('Remote deltas', deltasRemote);

    const {
      PULL: pullQueue,
      DELETE: deleteQueue,
      RENAME: renameQueue,
    } = this.generateActionQueues(
      deltasLocal,
      deltasRemote,
      currentLocal,
      currentRemote
    );

    await this.listingStore.removeSavedListing();

    const renameInLocal = renameQueue.get('LOCAL', 'FILE');
    const renameInRemote = renameQueue.get('REMOTE', 'FILE');
    const pullFromLocal = pullQueue.get('LOCAL', 'FILE');
    const pullFromRemote = pullQueue.get('REMOTE', 'FILE');
    const deleteInLocal = deleteQueue.get('LOCAL', 'FILE');
    const deleteInRemote = deleteQueue.get('REMOTE', 'FILE');

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
    Logger.debug('Queue delete from remote', deleteInRemote);

    await Promise.all([
      this.consumeRenameQueue(renameInLocal, this.local),
      this.consumeRenameQueue(renameInRemote, this.remote),
    ]);
    await Promise.all([
      this.consumePullQueue(pullFromLocal, this.local, this.remote),
      this.consumePullQueue(pullFromRemote, this.remote, this.local),
    ]);
    await Promise.all([
      this.consumeDeleteQueue(deleteInLocal, this.local),
      this.consumeDeleteQueue(deleteInRemote, this.remote),
    ]);

    const [foldersDeletedInLocal, foldersDeletedInRemote] = await Promise.all([
      this.listDeletedFolders(lastSavedListing, currentLocal, this.local),
      this.listDeletedFolders(lastSavedListing, currentRemote, this.remote),
    ]);

    Logger.log('Folders deleted in local', foldersDeletedInLocal);
    Logger.log('Folders deleted in remote', foldersDeletedInRemote);

    await Promise.all([
      this.consumeDeleteFolderQueue(foldersDeletedInRemote, this.local),
      this.consumeDeleteFolderQueue(foldersDeletedInLocal, this.remote),
    ]);

    const renameFoldersInLocal = renameQueue.get('LOCAL', 'FOLDER');
    const renameFoldersInRemote = renameQueue.get('REMOTE', 'FOLDER');

    Logger.log('Queue rename folders in local', renameFoldersInLocal);
    Logger.log('Queue rename folders in remote', renameFoldersInRemote);

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
    deltasLocal: Deltas,
    deltasRemote: Deltas,
    currentLocalListing: Listing,
    currentRemoteListing: Listing
  ): Queues {
    const pullQueue = new PullQueue();
    const deleteQueue = new DeleteQueue();
    const renameQueue = new RenameQueue();

    const keepMostRecent = (name: string, kind: ItemKind) => {
      const { modtime: modtimeInLocal } = currentLocalListing[name];
      const { modtime: modtimeInRemote } = currentRemoteListing[name];

      if (modtimeInLocal < modtimeInRemote) pullQueue.add('LOCAL', kind, name);
      else pullQueue.add('REMOTE', kind, name);
    };

    for (const [name, deltaLocal] of Object.entries(deltasLocal)) {
      const deltaRemote = deltasRemote[name];
      const doesntExistInRemote = deltaRemote === undefined;
      const sameModTime =
        currentLocalListing[name]?.modtime ===
        currentRemoteListing[name]?.modtime;

      if (deltaLocal.is('NEW') && doesntExistInRemote) {
        pullQueue.add('REMOTE', deltaLocal.itemKind, name);
        // eslint-disable-next-line no-continue
        continue;
      }
      if (deltaLocal.is('NEW') && deltaRemote.is('NEW') && !sameModTime) {
        keepMostRecent(name, deltaLocal.itemKind);
      }

      if (deltaLocal.is('NEWER') && deltaRemote.is('NEWER') && !sameModTime) {
        keepMostRecent(name, deltaLocal.itemKind);
      }

      if (
        deltaLocal.is('NEWER') &&
        (deltaRemote.is('DELETED') || deltaRemote.is('UNCHANGED'))
      ) {
        pullQueue.add('REMOTE', deltaLocal.itemKind, name);
      }

      if (deltaLocal.is('NEWER') && deltaRemote.is('OLDER')) {
        pullQueue.add('REMOTE', deltaLocal.itemKind, name);
      }

      if (
        deltaLocal.is('DELETED') &&
        (deltaRemote.is('NEWER') || deltaRemote.is('OLDER'))
      ) {
        pullQueue.add('LOCAL', deltaLocal.itemKind, name);
      }

      if (deltaLocal.is('DELETED') && deltaRemote.is('UNCHANGED')) {
        deleteQueue.add('REMOTE', deltaLocal.itemKind, name);
      }

      if (deltaLocal.is('OLDER') && deltaRemote.is('NEWER')) {
        pullQueue.add('LOCAL', deltaLocal.itemKind, name);
      }

      if (
        deltaLocal.is('OLDER') &&
        (deltaRemote.is('DELETED') || deltaRemote.is('UNCHANGED'))
      ) {
        pullQueue.add('REMOTE', deltaLocal.itemKind, name);
      }

      if (deltaLocal.is('OLDER') && deltaRemote.is('OLDER') && !sameModTime) {
        keepMostRecent(name, deltaLocal.itemKind);
      }

      if (
        deltaLocal.is('UNCHANGED') &&
        (deltaRemote.is('NEWER') || deltaRemote.is('OLDER'))
      ) {
        pullQueue.add('LOCAL', deltaLocal.itemKind, name);
      }

      if (deltaLocal.is('UNCHANGED') && deltaRemote.is('DELETED')) {
        deleteQueue.add('LOCAL', deltaLocal.itemKind, name);
      }
    }

    for (const [name, deltaRemote] of Object.entries(deltasRemote)) {
      if (deltaRemote.is('NEW') && !(name in deltasLocal)) {
        pullQueue.add('LOCAL', deltaRemote.itemKind, name);
      }
    }

    if (Object.entries(deltasLocal).length === 2) {
      const oldName = Object.entries(deltasLocal).find(([_, delta]) =>
        delta.is('RENAMED')
      )?.[0];

      const newName = Object.entries(deltasLocal).find(([_, delta]) =>
        delta.is('NEW_NAME')
      )?.[0];

      if (oldName && newName) {
        renameQueue.add('REMOTE', Object.values(deltasLocal)[0].itemKind, [
          oldName,
          newName,
        ]);
      }

      pullQueue.empty();
      deleteQueue.empty();
    }

    return {
      PULL: pullQueue,
      DELETE: deleteQueue,
      RENAME: renameQueue,
    };
  }

  private generateDeltas(saved: Listing, current: Listing): Deltas {
    const deltas: Deltas = {};

    for (const [name, { modtime: currentModTime, isFolder }] of Object.entries(
      current
    )) {
      const savedEntry = saved[name];

      if (!savedEntry) {
        deltas[name] = new Delta('NEW', isFolder);
      } else if (savedEntry.modtime === currentModTime) {
        deltas[name] = new Delta('UNCHANGED', isFolder);
      } else if (savedEntry.modtime < currentModTime) {
        deltas[name] = new Delta('NEWER', isFolder);
      } else {
        deltas[name] = new Delta('OLDER', isFolder);
      }
    }

    for (const name of Object.keys(saved)) {
      if (!(name in current)) {
        deltas[name] = new Delta('DELETED', saved[name].isFolder);
      }
    }

    const renameDeltas = generateRenameDeltas(deltas, saved, current);

    Logger.debug('RENAME DELTAS', renameDeltas);

    if (Object.keys(renameDeltas).length > 0) {
      return renameDeltas;
    }

    return deltas;
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

export type ListingStore = {
  /**
   * Returns the listing of the files
   * saved the last time
   * a sync was completed or null otherwise
   */
  getLastSavedListing(): Promise<Listing | null>;
  /**
   * Removes the last saved listing of files
   */
  removeSavedListing(): Promise<void>;
  /**
   * Saves a listing to be queried in
   * consecutive runs
   */
  saveListing(listing: Listing): Promise<void>;
};

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
