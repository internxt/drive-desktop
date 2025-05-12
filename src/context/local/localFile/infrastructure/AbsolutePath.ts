import { Brand } from '../../../shared/domain/Brand';
import { posix, win32 } from 'path';

export type AbsolutePath = Brand<string, 'AbsolutePath'>;
export type RelativePath = Brand<string, 'RelativePath'>;

export function createRelativePath(...parts: string[]): RelativePath {
  let path = posix.join(posix.sep, ...parts);
  path = path.replaceAll(win32.sep, posix.sep);
  path = posix.normalize(path);
  return path as RelativePath;
}
