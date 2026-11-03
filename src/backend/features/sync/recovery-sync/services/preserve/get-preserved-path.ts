import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { win32 } from 'node:path';
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
 * A destination inside any sync root would be synced again, so it is rejected for every root, not only the source one.
 */
export function getPreservedPath({ rootPath, rootPaths, sourcePath, destination }: Props): Result<AbsolutePath, PreservedPathError> {
  if (!isInsidePath({ parent: rootPath, path: sourcePath })) return Result.err(new PreservedPathError('OUTSIDE_SYNC_ROOT'));
  if (rootPaths.some((root) => root.toLowerCase() === destination.toLowerCase() || isInsidePath({ parent: root, path: destination }))) {
    return Result.err(new PreservedPathError('INSIDE_SYNC_ROOT'));
  }

  return Result.ok(join(destination, sourcePath.slice(rootPath.length + 1)));
}

export function isInsidePath({ parent, path }: { parent: AbsolutePath; path: AbsolutePath }) {
  return path.toLowerCase().startsWith(`${parent.toLowerCase()}/`);
}
