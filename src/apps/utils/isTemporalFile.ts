import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';

type Props = {
  path: AbsolutePath;
};

/**
 * v2.7.3 Victor Fernandez
 * A leading dot does not make a file temporary. Files like `.nomedia`, `.gitignore` or a wiki page saved with an
 * encoded name (`.C2.BF…`) were never uploaded, by the sync or by backups, and without notice. Only the
 * dot names that programs create while they work are temporary: LibreOffice and Emacs locks and FUSE leftovers.
 */
const temporaryNames = [
  /^~\$/, // Office owner files
  /^\.#/, // Emacs locks
  /^\.fuse_hidden/, // FUSE leftovers
  /^\.~lock\..*#$/, // LibreOffice locks
  /\.(tmp|temp|swp)$/i,
  /^\..*\.(swo|swn)$/i, // hidden Vim alternate swap files
];

export function isTemporaryFile({ path }: Props) {
  const name = basename(path);
  return temporaryNames.some((pattern) => pattern.test(name));
}
