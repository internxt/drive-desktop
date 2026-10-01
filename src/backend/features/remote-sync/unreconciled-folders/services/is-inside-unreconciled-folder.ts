import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { store } from '../store';

export function isInsideUnreconciledFolder({ path }: { path: AbsolutePath }) {
  const item = path.toLowerCase();

  for (const root of store.folders.values()) {
    if (item === root || item.startsWith(`${root}/`)) return true;
  }

  return false;
}
