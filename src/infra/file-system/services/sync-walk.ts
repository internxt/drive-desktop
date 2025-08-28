import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { stat, StatError } from './stat';

type Results = Array<{ absolutePath: AbsolutePath } & ({ stats: Stats; error?: undefined } | { error: StatError; stats?: undefined })>;
type Props = { rootFolder: string };

/**
 * v2.5.6 Daniel Jiménez
 * We cannot use `withFileTypes` because it treats everything as a symbolic link,
 * so we have to use `stat` for each entry.
 */
export async function syncWalk({ rootFolder }: Props) {
  const stack = [rootFolder];
  const results: Results = [];

  while (stack.length > 0) {
    const folder = stack.pop();
    if (!folder) continue;

    const entries = await readdir(folder);

    for (const entry of entries) {
      const absolutePath = join(folder, entry) as AbsolutePath;
      const { data: stats, error } = await stat({ absolutePath });

      if (stats) results.push({ absolutePath, stats });
      else results.push({ absolutePath, error });

      if (stats && stats.isDirectory()) {
        stack.push(absolutePath);
      }
    }
  }

  return results;
}
