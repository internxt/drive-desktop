import path from 'path';
import fs from 'fs/promises';

export async function clearThumbnailsFolders(folder: string) {
  const fileNames = await fs.readdir(folder);

  const filesDeletion = fileNames.map((name) => {
    const file = path.join(folder, name);
    return fs.unlink(file);
  });

  await Promise.all(filesDeletion);
}
