import { ContentsId } from './ContentsId';
import { LocalFileContents } from './LocalFileContents';

type ResultFilePath = string;

export interface LocalFileSystem {
  write(contents: LocalFileContents, name?: string): Promise<ResultFilePath>;

  remove(contentsId: ContentsId): Promise<void>;

  exists(contentsId: ContentsId): Promise<boolean>;

  add(contentsId: ContentsId, source: string): Promise<void>;

  listExistentFiles(): Promise<Array<ContentsId>>;
}
