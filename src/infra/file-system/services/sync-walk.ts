import { AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stats } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { fileSystem } from '../file-system.module';
import { StatError } from './stat';

export type SyncWalkItem = { path: AbsolutePath; stats: Stats };
type Props = { rootFolder: AbsolutePath; onError?: ({ path, error }: { path: AbsolutePath; error: StatError }) => void };

/**
 * v2.5.6 Daniel Jiménez
 * We cannot use `withFileTypes` because it treats everything as a symbolic link,
 * so we have to use `stat` for each entry.
 */
export async function syncWalk({ rootFolder, onError }: Props) {
  const stack = [rootFolder];
  const results: SyncWalkItem[] = [];

  while (stack.length > 0) {
    const folder = stack.pop();
    if (!folder) continue;

    const entries = await readdir(folder);

    for (const entry of entries) {
      const path = join(folder, entry);
      const { data: stats, error } = await fileSystem.stat({ absolutePath: path });

      if (error) {
        onError?.({ path, error });
      } else {
        results.push({ path, stats });
        if (stats.isDirectory()) stack.push(path);
      }
    }
  }

  return results;
}
