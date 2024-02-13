import { File } from '../File';
import { PlaceholderState } from '../PlaceholderState';

export interface LocalFileSystem {
  createPlaceHolder(file: File): Promise<void>;

  getLocalFileId(file: File): Promise<`${string}-${string}`>;

  updateSyncStatus(file: File): Promise<void>;

  convertToPlaceholder(file: File): Promise<void>;

  getPlaceholderState(file: File): Promise<void>;

  getPlaceholderStateByRelativePath(
    relativePath: string
  ): Promise<PlaceholderState>;
}
