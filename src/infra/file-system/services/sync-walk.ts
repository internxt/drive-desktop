import { AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { StatError } from './stat';
import { fileSystem } from '../file-system.module';

export type SyncWalkItem = { absolutePath: AbsolutePath } & ({ stats: Stats; error?: undefined } | { error: StatError; stats?: undefined });
type Props = { rootFolder: AbsolutePath };

/**
 * v2.5.6 Daniel Jiménez
 * We cannot use `withFileTypes` because it treats everything as a symbolic link,
 * so we have to use `stat` for each entry.
 */
export async function syncWalk({ rootFolder }: Props) {
  const stack = [rootFolder];
  const results: SyncWalkItem[] = [];

  while (stack.length > 0) {
    const folder = stack.pop();
    if (!folder) continue;

    const entries = await readdir(folder);

    for (const entry of entries) {
      const absolutePath = join(folder, entry);
      const { data: stats, error } = await fileSystem.stat({ absolutePath });

      if (stats) results.push({ absolutePath, stats });
      else results.push({ absolutePath, error });

      if (stats && stats.isDirectory()) {
        stack.push(absolutePath);
      }
    }
  }

  return results;
}
