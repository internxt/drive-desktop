import { LocalFileContents } from './LocalFileContents';

type ResultFilePath = string;

export interface LocalFileSystem {
  write(contents: LocalFileContents, name?: string): Promise<ResultFilePath>;

  remove(path: string): Promise<void>;

  exists(path: string): Promise<boolean>;
}
