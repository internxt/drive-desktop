import { File } from '../File';

export abstract class LocalFileSystem {
  abstract createPlaceHolder(file: File): Promise<void>;

  abstract getLocalFileId(file: File): Promise<`${string}-${string}`>;
}
