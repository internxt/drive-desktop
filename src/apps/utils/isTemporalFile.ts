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
const temporaryPrefixes = ['~$', '.#', '.fuse_hidden'];
const temporaryExtensions = new Set(['.tmp', '.temp', '.swp']);
const vimAlternateSwapExtensions = new Set(['.swo', '.swn']);

function isLibreOfficeLock({ name }: { name: string }) {
  return name.startsWith('.~lock.') && name.endsWith('#');
}

function isVimAlternateSwap({ name, extension }: { name: string; extension: string }) {
  return name.startsWith('.') && vimAlternateSwapExtensions.has(extension);
}

export function isTemporaryFile({ path }: Props) {
  const name = basename(path);
  const extension = extname(path).toLowerCase();

  if (temporaryPrefixes.some((prefix) => name.startsWith(prefix))) return true;
  if (isLibreOfficeLock({ name })) return true;
  if (temporaryExtensions.has(extension)) return true;
  if (isVimAlternateSwap({ name, extension })) return true;

  return false;
}
