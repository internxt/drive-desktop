import { LocalFileContents } from './LocalFileContents';

type ResultFilePath = string;

export interface LocalFileWriter {
  write(contents: LocalFileContents, name?: string): Promise<ResultFilePath>;
}
