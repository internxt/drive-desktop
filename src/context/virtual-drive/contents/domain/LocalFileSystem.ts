import { ContentsId } from './ContentsId';
import { LocalFileContents } from './LocalFileContents';
import { RemoteFileContents } from './RemoteFileContents';

type ResultFilePath = string;

export interface LocalFileSystem {
  write(contents: LocalFileContents, name?: string): Promise<ResultFilePath>;

  remove(contentsId: RemoteFileContents['id']): Promise<void>;

  exists(contentsId: RemoteFileContents['id']): Promise<boolean>;

  add(contentsId: ContentsId, source: string): Promise<void>;
}
