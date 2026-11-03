import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { posix, win32 } from 'node:path';
import { AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';

export class PreservedPathError extends Error {
  constructor(public readonly code: 'UNSUPPORTED_VOLUME' | 'OUTSIDE_SYNC_ROOT' | 'INSIDE_SYNC_ROOT') {
    super(code);
  }
}

/**
 * v2.7.2 Alexis Mora
 * Moves stay on the volume of their source because a rename cannot cross volumes,
 * so each volume gets its own destination at its root. Only drive letter volumes are supported.
 */
export function getVolume({ path }: { path: AbsolutePath }): Result<string, PreservedPathError> {
  const volume = win32.parse(path).root.replace(/[\\/]$/, '');
  if (!/^[a-z]:$/i.test(volume)) return Result.err(new PreservedPathError('UNSUPPORTED_VOLUME'));
  return Result.ok(volume.toUpperCase());
}

type Props = {
  rootPath: AbsolutePath;
  rootPaths: AbsolutePath[];
  sourcePath: AbsolutePath;
  destination: AbsolutePath;
};

/**
 * v2.7.2 Alexis Mora
 * The preserved item keeps its path relative to its sync root so the user can move it back where it was.
 * A preserved path inside any sync root would be synced again, so it is rejected for every root, not only the source one.
 * The final path is checked rather than the destination, because a sync root may be nested inside the destination.
 */
export function getPreservedPath({ rootPath, rootPaths, sourcePath, destination }: Props): Result<AbsolutePath, PreservedPathError> {
  if (!isInsidePath({ parent: rootPath, path: sourcePath })) return Result.err(new PreservedPathError('OUTSIDE_SYNC_ROOT'));

  const relative = toComponents({ path: sourcePath }).slice(toComponents({ path: rootPath }).length);
  const preservedPath = join(destination, ...relative);

  if (rootPaths.some((root) => isSame({ a: root, b: preservedPath }) || isInsidePath({ parent: root, path: preservedPath }))) {
    return Result.err(new PreservedPathError('INSIDE_SYNC_ROOT'));
  }

  return Result.ok(preservedPath);
}

/**
 * v2.7.2 Alexis Mora
 * Paths are compared folder by folder after resolving `..`, ignoring case and the trailing dots and spaces
 * Windows drops, so two spellings Windows opens as the same folder are treated as the same folder.
 */
function toComponents({ path }: { path: string }) {
  return posix.normalize(path).split('/').filter(Boolean);
}

function toKeys({ path }: { path: string }) {
  return toComponents({ path }).map((component) => component.replace(/[. ]+$/, '').toLowerCase());
}

function isSame({ a, b }: { a: AbsolutePath; b: AbsolutePath }) {
  const keysA = toKeys({ path: a });
  const keysB = toKeys({ path: b });
  return keysA.length === keysB.length && keysA.every((key, index) => key === keysB[index]);
}

export function isInsidePath({ parent, path }: { parent: AbsolutePath; path: AbsolutePath }) {
  const parentKeys = toKeys({ path: parent });
  const pathKeys = toKeys({ path });
  return pathKeys.length > parentKeys.length && parentKeys.every((key, index) => key === pathKeys[index]);
}
