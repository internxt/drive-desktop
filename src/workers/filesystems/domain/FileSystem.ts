/* eslint-disable no-unused-vars */
import { PartialListing } from '../../sync/Listings/domain/Listing';
import {
  FileSystemKind,
  ReadingMetaErrorEntry,
  Source,
  FileSystemProgressCallback,
} from '../../types';

export interface FileSystem<T extends PartialListing> {
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
    listing: T;
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
    progressCallback: FileSystemProgressCallback,
    abortSignal?: AbortSignal
  ): Promise<number | void>;

  /**
   * Creates a folder into this FileSystem and updates its modtime
   * @param name
   * @param modtime
   */
  pullFolder(name: string, modtime: number): Promise<void>;

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

  getFolderData(folderFullPath: string): Promise<{ modtime: number }>;
}
