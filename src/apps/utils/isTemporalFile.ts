import { basename, extname } from 'node:path';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  path: AbsolutePath;
};

export function isTemporaryFile({ path }: Props) {
  const name = basename(path);
  const extension = extname(path).toLowerCase();

  if (name.startsWith('.')) return true;
  if (name.startsWith('~$')) return true;

  const tempExtensions = ['.tmp', '.temp', '.swp'];
  if (tempExtensions.includes(extension)) return true;

  return false;
}
