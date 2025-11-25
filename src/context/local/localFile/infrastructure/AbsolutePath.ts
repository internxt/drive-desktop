import { posix, win32 } from 'node:path';
import { AbsolutePath as CoreAbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type AbsolutePath = CoreAbsolutePath;

export function createAbsolutePath(...parts: string[]) {
  let path = posix.join(...parts);
  path = path.replaceAll(win32.sep, posix.sep);
  path = posix.normalize(path);
  if (path.endsWith(posix.sep)) path = path.slice(0, -1);
  return path as AbsolutePath;
}

export const abs = createAbsolutePath;

export function dirname(path: AbsolutePath) {
  return posix.dirname(path) as AbsolutePath;
}

export function join(path: AbsolutePath, ...paths: string[]) {
  return posix.join(path, ...paths) as AbsolutePath;
}

export const pathUtils = {
  dirname,
  createAbsolutePath,
};
