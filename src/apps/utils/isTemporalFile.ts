import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename, extname } from 'node:path';

type Props = {
  path: AbsolutePath;
};

/**
 * v2.7.3 Victor Fernandez
 * A leading dot does not make a file temporary. Files like `.nomedia`, `.gitignore` or a wiki page saved with an
 * encoded name (`.C2.BF…`) were never uploaded, by the sync or by backups, and without notice. Only the
 * dot names that programs create while they work are temporary: LibreOffice and Emacs locks and FUSE leftovers.
 */
const temporaryPrefixes = ['~$', '.~lock.', '.#', '.fuse_hidden'];
const temporaryExtensions = ['.tmp', '.temp', '.swp'];

export function isTemporaryFile({ path }: Props) {
  const name = basename(path);
  const extension = extname(path).toLowerCase();

  if (temporaryPrefixes.some((prefix) => name.startsWith(prefix))) return true;
  if (temporaryExtensions.includes(extension)) return true;

  return false;
}
