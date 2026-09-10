import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { store } from '../store';

/**
 * BR-2245
 * Windows paths are case insensitive, so the path reported by the watcher and the one
 * stored while traversing can differ in case and still be the same folder.
 */
export function isInsideUnreconciledFolder({ path }: { path: AbsolutePath }) {
  const item = path.toLowerCase();

  for (const folder of store.folders.values()) {
    const root = folder.toLowerCase();
    if (item === root || item.startsWith(`${root}/`)) return true;
  }

  return false;
}
