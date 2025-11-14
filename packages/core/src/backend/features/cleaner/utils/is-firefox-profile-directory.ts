import { Dirent } from 'node:fs';

type Props = {
  entry: Dirent;
  parentPath: string;
};

export function isFirefoxProfileDirectory({ entry, parentPath }: Props) {
  if (!entry.isDirectory()) return false;
  if (!parentPath.toLowerCase().includes('profiles')) return false;

  const profileRegex = /^[a-z0-9]+\.default(-[a-z]+)?$/i;
  return profileRegex.test(entry.name);
}
