import fs from 'fs/promises';

export function doesFileExist(path: string): Promise<boolean> {
  return fs
    .stat(path)
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}
