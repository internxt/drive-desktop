import { File } from '../File';

export interface LocalFileSystem {
  createPlaceHolder(file: File): Promise<void>;

  getLocalFileId(file: File): Promise<`${string}-${string}`>;

  updateSyncStatus(file: File): Promise<void>;

  convertToPlaceholder(file: File): Promise<void>;
}
