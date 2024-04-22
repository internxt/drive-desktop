import { Service } from 'diod';
import { ContentsId } from './ContentsId';
import { ContentsMetadata } from './ContentsMetadata';
import { LocalFileContents } from './LocalFileContents';

type ResultFilePath = string;

@Service()
export abstract class LocalFileSystem {
  abstract write(
    contents: LocalFileContents,
    name?: string
  ): Promise<ResultFilePath>;

  abstract remove(contentsId: ContentsId): Promise<void>;

  abstract exists(contentsId: ContentsId): Promise<boolean>;

  /**
   * @return the FileMetadata of the file or undefined if does not exits
   */
  abstract metadata(
    contentsId: ContentsId
  ): Promise<ContentsMetadata | undefined>;

  abstract add(contentsId: ContentsId, source: string): Promise<void>;

  abstract listExistentFiles(): Promise<Array<ContentsId>>;
}
