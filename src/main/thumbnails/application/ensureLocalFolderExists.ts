import fs from 'fs/promises';

export async function ensureLocalFolderExists(path: string) {
  try {
    await fs.access(path);
  } catch {
    await fs.mkdir(path);
  }
}
