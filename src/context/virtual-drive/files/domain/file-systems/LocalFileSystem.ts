import { File } from '../File';
import { PlaceholderState } from '../PlaceholderState';

export abstract class LocalFileSystem {
  abstract createPlaceHolder(file: File): Promise<void>;
  abstract fileExists(filePath: string): Promise<boolean>;
  abstract getLocalFileId(file: File): Promise<`${string}-${string}`>;
  abstract updateSyncStatus(file: File): Promise<void>;
  abstract getFileIdentity(path: File['path']): Promise<string>;
  abstract deleteFileSyncRoot(path: File['path']): Promise<void>;
  abstract convertToPlaceholder(file: File): Promise<void>;
  abstract getPlaceholderState(file: File): Promise<void>;
  abstract getPlaceholderStateByRelativePath(
    relativePath: string
  ): Promise<PlaceholderState>;
  abstract updateFileIdentity(
    path: File['path'],
    newIdentity: string
  ): Promise<void>;
}
