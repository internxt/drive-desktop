import { EventEmitter } from 'events';
import path from 'path';
import _ from 'lodash';
import Logger from 'electron-log';
import {
  ErrorDetails,
  FileSystem,
  FileSystemKind,
  Listing,
  ProcessError,
  ProcessErrorName,
  ProcessFatalError,
  ReadingMetaErrorEntry,
} from '../types';
import { createErrorDetails } from '../utils/reporting';

class Sync extends EventEmitter {
  constructor(
    private readonly local: FileSystem,
    private readonly remote: FileSystem,
    private readonly listingStore: ListingStore
  ) {
    super();
  }

  async run(): Promise<SyncResult> {
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
      renameInLocal,
      renameInRemote,
      pullFromLocal,
      pullFromRemote,
      deleteInLocal,
      deleteInRemote,
    } = this.generateActionQueues(
      deltasLocal,
      deltasRemote,
      currentLocal,
      currentRemote
    );

    await this.listingStore.removeSavedListing();

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

    return this.finalize();
  }

  private async resync(): Promise<SyncResult> {
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
      const modtimeInLocal = currentLocal[name];
      const modtimeInRemote = currentRemote[name];

      if (modtimeInLocal < modtimeInRemote) pullFromLocal.push(name);
      else pullFromRemote.push(name);
    }

    Logger.debug('Queue pull from local', pullFromLocal);
    Logger.debug('Queue pull from remote', pullFromRemote);

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
  ): {
    renameInLocal: [string, string][];
    renameInRemote: [string, string][];
    pullFromLocal: string[];
    pullFromRemote: string[];
    deleteInLocal: string[];
    deleteInRemote: string[];
  } {
    const pullFromLocal: string[] = [];
    const pullFromRemote: string[] = [];
    const renameInLocal: [string, string][] = [];
    const renameInRemote: [string, string][] = [];
    const deleteInLocal: string[] = [];
    const deleteInRemote: string[] = [];

    const keepMostRecent = (name: string) => {
      const modtimeInLocal = currentLocalListing[name];
      const modtimeInRemote = currentRemoteListing[name];

      if (modtimeInLocal < modtimeInRemote) pullFromLocal.push(name);
      else pullFromRemote.push(name);
    };

    for (const [name, deltaLocal] of Object.entries(deltasLocal)) {
      const deltaRemote = deltasRemote[name];
      const doesntExistInRemote = deltaRemote === undefined;
      const sameModTime =
        currentLocalListing[name] === currentRemoteListing[name];

      if (deltaLocal === 'NEW' && deltaRemote === 'NEW' && !sameModTime) {
        keepMostRecent(name);
      }

      if (deltaLocal === 'NEW' && doesntExistInRemote) {
        pullFromRemote.push(name);
      }

      if (deltaLocal === 'NEWER' && deltaRemote === 'NEWER' && !sameModTime) {
        keepMostRecent(name);
      }

      if (
        deltaLocal === 'NEWER' &&
        (deltaRemote === 'DELETED' || deltaRemote === 'UNCHANGED')
      ) {
        pullFromRemote.push(name);
      }

      if (deltaLocal === 'NEWER' && deltaRemote === 'OLDER') {
        pullFromRemote.push(name);
      }

      if (
        deltaLocal === 'DELETED' &&
        (deltaRemote === 'NEWER' || deltaRemote === 'OLDER')
      ) {
        pullFromLocal.push(name);
      }

      if (deltaLocal === 'DELETED' && deltaRemote === 'UNCHANGED') {
        deleteInRemote.push(name);
      }

      if (deltaLocal === 'OLDER' && deltaRemote === 'NEWER') {
        pullFromLocal.push(name);
      }

      if (
        deltaLocal === 'OLDER' &&
        (deltaRemote === 'DELETED' || deltaRemote === 'UNCHANGED')
      ) {
        pullFromRemote.push(name);
      }

      if (deltaLocal === 'OLDER' && deltaRemote === 'OLDER' && !sameModTime) {
        keepMostRecent(name);
      }

      if (
        deltaLocal === 'UNCHANGED' &&
        (deltaRemote === 'NEWER' || deltaRemote === 'OLDER')
      ) {
        pullFromLocal.push(name);
      }

      if (deltaLocal === 'UNCHANGED' && deltaRemote === 'DELETED') {
        deleteInLocal.push(name);
      }
    }

    for (const [name, deltaRemote] of Object.entries(deltasRemote)) {
      if (deltaRemote === 'NEW' && !(name in deltasLocal)) {
        pullFromLocal.push(name);
      }
    }

    return {
      pullFromLocal,
      pullFromRemote,
      renameInLocal,
      renameInRemote,
      deleteInLocal,
      deleteInRemote,
    };
  }

  private generateDeltas(saved: Listing, current: Listing): Deltas {
    const deltas: Deltas = {};

    for (const [name, currentModTime] of Object.entries(current)) {
      const savedModTime = saved[name];

      if (!savedModTime) {
        deltas[name] = 'NEW';
      } else if (savedModTime === currentModTime) {
        deltas[name] = 'UNCHANGED';
      } else if (savedModTime < currentModTime) {
        deltas[name] = 'NEWER';
      } else {
        deltas[name] = 'OLDER';
      }
    }

    for (const name of Object.keys(saved)) {
      if (!(name in current)) {
        deltas[name] = 'DELETED';
      }
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

  private rename(name: string, sufix: string): string {
    const { dir, ext, name: base } = path.parse(name);

    return `${dir ? `${dir}/` : ''}${base}_${sufix}${ext}`;
  }

  private async consumeRenameQueue(
    queue: [string, string][],
    fileSystem: FileSystem
  ): Promise<void> {
    for (const [oldName, newName] of queue) {
      this.emit('RENAMING_FILE', oldName, newName, fileSystem.kind);

      try {
        await fileSystem.renameFile(oldName, newName);
        this.emit('FILE_RENAMED', oldName, newName, fileSystem.kind);
      } catch (err) {
        const syncError =
          err instanceof ProcessError
            ? err
            : new ProcessError(
                'UNKNOWN',
                createErrorDetails(
                  err,
                  'Renaming file',
                  `oldName: ${oldName}, newName: ${newName}, kind: ${fileSystem.kind}`
                )
              );

        this.emit(
          'ERROR_RENAMING_FILE',
          oldName,
          newName,
          fileSystem.kind,
          syncError.name as ProcessErrorName,
          syncError.details
        );
      }
    }
  }

  private async consumePullQueue(
    queue: string[],
    destFs: Pick<FileSystem, 'pullFile' | 'kind'>,
    srcFs: Pick<FileSystem, 'getSource'>
  ): Promise<void> {
    for (const name of queue) {
      const progressCallback = (progress: number) =>
        this.emit('PULLING_FILE', name, progress, destFs.kind);
      progressCallback(0);

      try {
        const source = await srcFs.getSource(name, progressCallback);
        await destFs.pullFile(name, source, progressCallback);
        this.emit('FILE_PULLED', name, destFs.kind);
      } catch (err) {
        const syncError =
          err instanceof ProcessError
            ? err
            : new ProcessError(
                'UNKNOWN',
                createErrorDetails(
                  err,
                  'Pulling file',
                  `name: ${name}, kind: ${destFs.kind}`
                )
              );
        this.emit(
          'ERROR_PULLING_FILE',
          name,
          destFs.kind,
          syncError.name as ProcessErrorName,
          syncError.details
        );
      }
    }
  }

  private async consumeDeleteQueue(
    queue: string[],
    fileSystem: FileSystem
  ): Promise<void> {
    for (const name of queue) {
      this.emit('DELETING_FILE', name, fileSystem.kind);

      try {
        await fileSystem.deleteFile(name);
        this.emit('FILE_DELETED', name, fileSystem.kind);
      } catch (err) {
        const syncError =
          err instanceof ProcessError
            ? err
            : new ProcessError(
                'UNKNOWN',
                createErrorDetails(
                  err,
                  'Deleting file',
                  `name: ${name}, kind: ${fileSystem.kind}`
                )
              );
        this.emit(
          'ERROR_DELETING_FILE',
          name,
          fileSystem.kind,
          syncError.name as ProcessErrorName,
          syncError.details
        );
      }
    }
  }

  private async consumeDeleteFolderQueue(
    queue: string[],
    fileSystem: FileSystem
  ): Promise<void> {
    for (const name of queue) {
      this.emit('DELETING_FOLDER', name, fileSystem.kind);

      try {
        await fileSystem.deleteFolder(name);
        this.emit('FOLDER_DELETED', name, fileSystem.kind);
      } catch (err) {
        const syncError =
          err instanceof ProcessError
            ? err
            : new ProcessError(
                'UNKNOWN',
                createErrorDetails(
                  err,
                  'Deleting folder',
                  `name: ${name}, kind: ${fileSystem.kind}`
                )
              );
        this.emit(
          'ERROR_DELETING_FOLDER',
          name,
          fileSystem.kind,
          syncError.name as ProcessErrorName,
          syncError.details
        );
      }
    }
  }

  private async finalize(): Promise<SyncResult> {
    this.emit('FINALIZING');

    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: false,
    });

    if (_.isEqual(currentLocal, currentRemote)) {
      const currentInBoth = currentLocal;
      Logger.debug('Current in both:', currentInBoth);

      await this.listingStore.saveListing(currentInBoth);

      return { status: 'IN_SYNC' };
    } else {
      Logger.debug('Current local:', currentLocal);
      Logger.debug('Current remote:', currentRemote);

      const diff = this.getListingsDiff(currentLocal, currentRemote);
      return { status: 'NOT_IN_SYNC', diff };
    }
  }

  private getListingsDiff(local: Listing, remote: Listing): ListingsDiff {
    const filesNotInLocal = [];
    const filesNotInRemote = [];
    const filesWithDifferentModtime = [];

    for (const [localName, localModtime] of Object.entries(local)) {
      const remoteModTime = remote[localName];

      if (!remoteModTime) {
        filesNotInRemote.push(localName);
      } else if (localModtime !== remoteModTime) {
        filesWithDifferentModtime.push(localName);
      }
    }

    for (const remoteName of Object.keys(remote)) {
      if (!(remoteName in local)) {
        filesNotInLocal.push(remoteName);
      }
    }

    return { filesNotInLocal, filesNotInRemote, filesWithDifferentModtime };
  }

  private async getCurrentListings(options: { emitErrors: boolean }): Promise<{
    currentLocal: Listing;
    currentRemote: Listing;
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

  private emitReadingMetaErrors(
    errors: ReadingMetaErrorEntry[],
    kind: FileSystemKind
  ) {
    errors.forEach((entry) => {
      this.emit(
        'ERROR_READING_METADATA',
        entry.name,
        kind,
        entry.errorName,
        entry.errorDetails
      );
    });
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

export type Deltas = Record<string, Delta>;

type Delta = 'NEW' | 'NEWER' | 'DELETED' | 'OLDER' | 'UNCHANGED';

interface SyncEvents {
  /**
   * Triggered when the process tries to test
   * whether the filesystems are operational
   */
  SMOKE_TESTING: () => void;
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
   * Triggered when the default run has started and processing
   * what changes need to be done in remote/local to be
   * properly synced
   */
  GENERATING_ACTIONS_NEEDED_TO_SYNC: () => void;

  /**
   * Triggered when a file is being pulled
   */
  PULLING_FILE: (
    name: string,
    progress: number,
    fileSystemKind: FileSystemKind
  ) => void;
  /**
   * Triggered when a file has been pulled
   */
  FILE_PULLED: (name: string, fileSystemKind: FileSystemKind) => void;
  /**
   * Triggered when an error has occurred while pulling a file
   */
  ERROR_PULLING_FILE: (
    name: string,
    fileSystemKind: FileSystemKind,
    errName: ProcessErrorName,
    errDetails: ErrorDetails
  ) => void;

  /**
   * Triggered when a file is being deleted
   */
  DELETING_FILE: (name: string, fileSystemKind: FileSystemKind) => void;
  /**
   * Triggered when a file has been deleted
   */
  FILE_DELETED: (name: string, fileSystemKind: FileSystemKind) => void;
  /**
   * Triggered when an error has occurred while deleting a file
   */
  ERROR_DELETING_FILE: (
    name: string,
    fileSystemKind: FileSystemKind,
    errName: ProcessErrorName,
    errDetails: ErrorDetails
  ) => void;

  /**
   * Triggered when a folder is being deleted
   */
  DELETING_FOLDER: (name: string, fileSystemKind: FileSystemKind) => void;
  /**
   * Triggered when a folder has been deleted
   */
  FOLDER_DELETED: (name: string, fileSystemKind: FileSystemKind) => void;
  /**
   * Triggered when an error has occurred while deleting a folder
   */
  ERROR_DELETING_FOLDER: (
    name: string,
    fileSystemKind: FileSystemKind,
    errName: ProcessErrorName,
    errDetails: ErrorDetails
  ) => void;

  /**
   * Triggered when a file is being renamed
   */
  RENAMING_FILE: (
    oldName: string,
    newName: string,
    fileSystemKind: FileSystemKind
  ) => void;
  /**
   * Triggered when a file has been renamed
   */
  FILE_RENAMED: (
    oldName: string,
    newName: string,
    fileSystemKind: FileSystemKind
  ) => void;
  /**
   * Triggered when an error has occurred while renaming a file
   */
  ERROR_RENAMING_FILE: (
    oldName: string,
    newName: string,
    fileSystemKind: FileSystemKind,
    errName: ProcessErrorName,
    errDetails: ErrorDetails
  ) => void;

  /**
   * Triggered when an error has occurred while reading the metadata of a file
   */
  ERROR_READING_METADATA: (
    name: string,
    fileSystemKind: FileSystemKind,
    errName: ProcessErrorName,
    errDetails: ErrorDetails
  ) => void;

  /**
   * Triggered when the changes needed to be in sync
   * have been made (either by a default run or a resync)
   * and new listings will be generated and saved if the
   * filesystems are in sync
   */
  FINALIZING: () => void;
}

export type SyncResult = SuccessfulSyncResult | UnsuccessfulSyncResult;

type SuccessfulSyncResult = {
  status: 'IN_SYNC';
};

type UnsuccessfulSyncResult = {
  status: 'NOT_IN_SYNC';
  diff: ListingsDiff;
};

type ListingsDiff = {
  filesNotInLocal: string[];
  filesNotInRemote: string[];
  filesWithDifferentModtime: string[];
};

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
