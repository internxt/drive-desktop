import { LocalFileContents } from './LocalFileContents';

type ResultFilePath = string;

export interface LocalFileWriter {
  write(contents: LocalFileContents): Promise<ResultFilePath>;
}
