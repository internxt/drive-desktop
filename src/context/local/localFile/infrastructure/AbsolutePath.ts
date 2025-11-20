import { posix, win32, dirname as rawDirname } from 'node:path';
import { AbsolutePath as CoreAbsolutePath, RelativePath as CoreRelativePath } from '@internxt/drive-desktop-core/build/backend';

export type AbsolutePath = CoreAbsolutePath;
export type RelativePath = CoreRelativePath;

function parsePath({ path }: { path: string }) {
  path = path.replaceAll(win32.sep, posix.sep);
  path = posix.normalize(path);
  /**
   * v2.5.6 Daniel Jiménez
   * If the path is not the root path "/" remote the last slash "/a/b/" -> "/a/b"
   */
  path = path !== '/' ? path.replace(/\/+$/, '') : path;
  return path;
}

export function createAbsolutePath(...parts: string[]) {
  const path = posix.join(...parts);
  return parsePath({ path }) as AbsolutePath;
}

export function createRelativePath(...parts: string[]) {
  const path = posix.join(posix.sep, ...parts);
  return parsePath({ path }) as RelativePath;
}

export function dirname<T extends RelativePath | AbsolutePath>(path: T) {
  return rawDirname(path) as T;
}

function absoluteToRelative({ base, path }: { base: AbsolutePath; path: AbsolutePath }) {
  const relativePath = win32.relative(base, path);
  return createRelativePath(relativePath);
}

export const pathUtils = {
  dirname,
  parsePath,
  createRelativePath,
  createAbsolutePath,
  absoluteToRelative,
};

export const abs = createAbsolutePath;

export function join(path: AbsolutePath, ...paths: string[]) {
  return posix.join(path, ...paths) as AbsolutePath;
}
