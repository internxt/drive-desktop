import { Readable } from 'stream';

export interface FileSystem {
  /**
   * The kind of filesystem, it's emitted
   * in some fs events
   */
  kind: FileSystemKind;

  /**
   * Returns the listing of the current files
   * in this FileSystem
   */
  getCurrentListing(): Promise<{
    listing: Listing;
    readingMetaErrors: ReadingMetaErrorEntry[];
  }>;

  /**
   * Renames a file in the FileSystem
   * @param oldName
   * @param newName
   */
  renameFile(oldName: string, newName: string): Promise<void>;

  /**
   * Deletes a file in the FileSystem,
   * doesn't throw if the file doesn't exist anymore
   * @param name
   */
  deleteFile(name: string): Promise<void>;

  /**
   * Pulls a file from other FileSystem into this FileSystem,
   * overwriting it if already exists
   * @param name
   * @param source
   * @param progressCallback
   */
  pullFile(
    name: string,
    source: Source,
    progressCallback: FileSystemProgressCallback
  ): Promise<number | void>;

  /**
   * Checks if a folder exists in the filesystem
   * @param name
   */
  existsFolder(name: string): Promise<boolean>;

  /**
   * Deletes a folder in the filesystem
   * doesn't throw if the folder doesn't exist anymore
   * @param name
   */
  deleteFolder(name: string): Promise<void>;

  /**
   * Returns an object source that contains
   * anything that another filesystem would need
   * to pull it
   * @param name
   * @param progressCallback
   */
  getSource(
    name: string,
    progressCallback: FileSystemProgressCallback
  ): Promise<Source>;

  /**
   * Check critical resources of this filesystem
   * and throw an error if it's not operative
   */
  smokeTest(): Promise<void>;
}

export type FileSystemKind = 'LOCAL' | 'REMOTE';

export type ReadingMetaErrorEntry = {
  name: string;
  errorName: ProcessErrorName;
  errorDetails: ErrorDetails;
};

export type FileSystemProgressCallback = (progress: number) => void;

export type Source = {
  stream: Readable;
  modTime: number;
  size: number;
};

/**
 * Represents a list of files, each with
 * its modTime that is set as seconds since epoch
 * and size in bytes
 *
 * The name of each file can be namespaced by
 * his ancestors such as: folderA/folderB/fileName
 * It cannot start or end with "/"
 */
export type Listing = Record<string, { modtime: number; size: number }>;

export type ProcessFatalErrorName =
  | 'NO_INTERNET'
  | 'NO_REMOTE_CONNECTION'
  | 'CANNOT_ACCESS_BASE_DIRECTORY'
  | 'BASE_DIRECTORY_DOES_NOT_EXIST'
  | 'INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY'
  | 'CANNOT_ACCESS_TMP_DIRECTORY'
  | 'CANNOT_GET_CURRENT_LISTINGS'
  | 'UNKNOWN';

export class ProcessFatalError extends Error {
  details: ErrorDetails;

  constructor(name: ProcessFatalErrorName, details: ErrorDetails) {
    super();
    this.name = name;
    this.details = details;
  }
}

export type GeneralErrorName = 'UNKNOWN_DEVICE_NAME';
export type ProcessErrorName =
  | 'NOT_EXISTS'
  | 'NO_PERMISSION'
  | 'NO_INTERNET'
  | 'NO_REMOTE_CONNECTION'
  | 'BAD_RESPONSE'
  | 'EMPTY_FILE'
  | 'FILE_TOO_BIG'
  | 'FILE_NON_EXTENSION'
  | 'UNKNOWN'
  | 'DUPLICATED_NODE'
  | 'FILE_ALREADY_EXISTS'
  | 'BAD_REQUEST'
  | 'BASE_DIRECTORY_DOES_NOT_EXIST'
  | 'INSUFFICIENT_PERMISSION'
  | 'COULD_NOT_ENCRYPT_NAME'
  | 'NOT_ENOUGH_SPACE'
  | 'ACTION_NOT_PERMITTED';

export class ProcessError extends Error {
  details: ErrorDetails;

  constructor(name: ProcessErrorName, details: ErrorDetails) {
    super();
    this.name = name;
    this.details = details;
  }
}

/**
 * Only for error reporting purposes, should not be used
 * to adjust UI to specific errors for example.
 * That's what SyncError and SyncFatalError classes are for
 */
export type ErrorDetails = {
  /* Describes in natural language what was being
   done when this error was thrown */
  action: string;

  // Message of the original error instance
  message: string;
  // Error code of the original error instance
  code: string;
  // Stack of the original error instance
  stack: string;

  /* SYSTEM ERROR SPECIFICS */

  // Error number
  errno?: number;
  // System call name
  syscall?: string;
  // Extra details about the error
  info?: Record<string, any>;

  // Aditional info that could be helpful
  // to debug
  additionalInfo?: string;
};

type ProcessInfoBase = {
  kind: FileSystemKind;
  name: string;
};

export type GeneralIssue = {
  action: 'GET_DEVICE_NAME_ERROR';
  errorName: GeneralErrorName;
  process: 'GENERAL';
  errorDetails: {
    name: string;
    message: string;
    stack: string;
  };
};
export type ProcessIssue = ProcessInfoBase & {
  action:
    | 'UPLOAD_ERROR'
    | 'DOWNLOAD_ERROR'
    | 'RENAME_ERROR'
    | 'DELETE_ERROR'
    | 'METADATA_READ_ERROR'
    | 'GENERATE_TREE';

  errorName: ProcessErrorName;
  process: 'SYNC' | 'BACKUPS';
};

export type ProcessInfoUpdatePayload =
  | (ProcessInfoBase &
      (
        | {
            action:
              | 'UPLOADING'
              | 'DOWNLOADING'
              | 'PREPARING'
              | 'RENAMING'
              | 'DELETING';
            progress: number;
          }
        | {
            action:
              | 'UPLOADED'
              | 'DOWNLOADED'
              | 'RENAMED'
              | 'DELETED'
              | 'DOWNLOAD_CANCEL';
          }
      ))
  | ProcessIssue;

type SyncActionName =
  | 'renameInLocal'
  | 'renameInRemote'
  | 'pullFromLocal'
  | 'pullFromRemote'
  | 'deleteInLocal'
  | 'deleteInRemote';

type SyncAction = Array<[string, string]> | Array<string>;

export type EnqueuedSyncActions = Partial<Record<SyncActionName, SyncAction>>;
