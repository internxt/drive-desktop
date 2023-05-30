import { FilePath } from './FilePath';
import { WebdavFile } from './WebdavFile';

type Action<F extends Array<any>, T> = {
  run(params: F): Promise<T>;
};

export type MoveFile = Action<
  [file: WebdavFile, destination: FilePath, overwrite: boolean],
  boolean
>;

export type DuplicateFile = Action<
  [file: WebdavFile, destination: FilePath, overwrite: boolean],
  boolean
>;
