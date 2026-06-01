import fs from 'node:fs/promises';
export async function fileExistsOnDisk(filePath: string): Promise<boolean> {
  return fs
    .stat(filePath)
    .then(() => true)
    .catch(() => false);
}
