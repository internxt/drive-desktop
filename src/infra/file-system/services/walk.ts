import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { readdir } from 'fs/promises';
import { join } from 'path';

type Results = Array<{ absolutePath: AbsolutePath; isFile: boolean; isFolder: boolean }>;
type Props = { rootFolder: string };

/**
 * v2.5.7 Daniel Jiménez
 * We do not use recursive in readdir, because it has strange behaviours with withFileTypes.
 * https://github.com/nodejs/node/issues/48640
 */
export async function walk({ rootFolder }: Props) {
  const stack = [rootFolder];
  const results: Results = [];

  while (stack.length > 0) {
    const folder = stack.pop();
    if (!folder) continue;

    const entries = await readdir(folder, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(folder, entry.name) as AbsolutePath;
      const isFolder = entry.isDirectory();

      results.push({ absolutePath, isFile: entry.isFile(), isFolder });

      if (isFolder) {
        stack.push(absolutePath);
      }
    }
  }

  return results;
}
