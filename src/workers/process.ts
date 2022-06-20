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
} from './types';
import { createErrorDetails } from './utils/reporting';

abstract class Process extends EventEmitter {
  constructor(
    protected readonly local: FileSystem,
    protected readonly remote: FileSystem
  ) {
    super();
  }

  protected rename(name: string, sufix: string): string {
    const { dir, ext, name: base } = path.parse(name);

    return `${dir ? `${dir}/` : ''}${base}_${sufix}${ext}`;
  }

  protected async consumeRenameQueue(
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

  protected async consumePullQueue(
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

  protected async consumeDeleteQueue(
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

  protected async consumeDeleteFolderQueue(
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

  protected getListingsDiff(local: Listing, remote: Listing): ListingsDiff {
    const filesNotInLocal = [];
    const filesNotInRemote = [];
    const filesWithDifferentModtime = [];
    const filesInSync: Listing = {};

    for (const [localName, { modtime: localModtime }] of Object.entries(
      local
    )) {
      const entryInRemote = remote[localName];

      if (!entryInRemote) {
        filesNotInRemote.push(localName);
      } else if (localModtime !== entryInRemote.modtime) {
        filesWithDifferentModtime.push(localName);
      } else {
        filesInSync[localName] = entryInRemote;
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

  protected async getCurrentListings(options: {
    emitErrors: boolean;
  }): Promise<{
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

  protected emitReadingMetaErrors(
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

  protected async generateResult(): Promise<
    (SuccessfulProcessResult & { listing: Listing }) | UnsuccessfulProcessResult
  > {
    const { currentLocal, currentRemote } = await this.getCurrentListings({
      emitErrors: false,
    });

    if (_.isEqual(currentLocal, currentRemote)) {
      const currentInBoth = currentLocal;
      Logger.debug('Current in both:', currentInBoth);

      return { status: 'IN_SYNC', listing: currentInBoth };
    } else {
      Logger.debug('Current local:', currentLocal);
      Logger.debug('Current remote:', currentRemote);

      const diff = this.getListingsDiff(currentLocal, currentRemote);
      return { status: 'NOT_IN_SYNC', diff };
    }
  }

  abstract run(): Promise<ProcessResult>;
}

export interface ProcessEvents {
  /**
   * Triggered when the process tries to test
   * whether the filesystems are operational
   */
  SMOKE_TESTING: () => void;
  /**
   * Triggered when processing what changes
   * need to be done in remote/local to be
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
}

export type ListingsDiff = {
  filesNotInLocal: string[];
  filesNotInRemote: string[];
  filesWithDifferentModtime: string[];
  filesInSync: Listing;
};

export type ProcessResult = SuccessfulProcessResult | UnsuccessfulProcessResult;

type SuccessfulProcessResult = {
  status: 'IN_SYNC';
};

type UnsuccessfulProcessResult = {
  status: 'NOT_IN_SYNC';
  diff: ListingsDiff;
};

export default Process;
