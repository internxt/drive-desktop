import { File } from '../File';
import { PlaceholderState } from '../PlaceholderState';

export interface LocalFileSystem {
  createPlaceHolder(file: File): Promise<void>;

  fileExists(filePath: string): Promise<boolean>;

  getLocalFileId(file: File): Promise<`${string}-${string}`>;

  updateSyncStatus(file: File): Promise<void>;

  getFileIdentity(path: File['path']): Promise<string>;

  deleteFileSyncRoot(path: File['path']): Promise<void>;

  convertToPlaceholder(file: File): Promise<void>;

  getPlaceholderState(file: File): Promise<void>;

  getPlaceholderStateByRelativePath(
    relativePath: string
  ): Promise<PlaceholderState>;

  updateFileIdentity(path: File['path'], newIdentity: string): Promise<void>;
}
