import { Brand } from '../../../shared/domain/Brand';
import { posix } from 'node:path';

export type AbsolutePath = Brand<string, 'AbsolutePath'>;

export function createAbsolutePath(...parts: string[]): AbsolutePath {
  let path = posix.join(...parts);
  path = posix.normalize(path);
  if (path.endsWith(posix.sep)) path = path.slice(0, -1);
  return path as AbsolutePath;
}
