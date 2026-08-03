import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getWorkerCount } from '@/core/utils/concurrency';
import { fileSystem } from '../file-system.module';
import { StatError } from './stat';

export type StatItem = { path: AbsolutePath; stats: Stats };
type Props = {
  folder: AbsolutePath;
  concurrency?: number;
  onError?: ({ path, error }: { path: AbsolutePath; error: StatError }) => void;
};
const DEFAULT_STAT_READDIR_CONCURRENCY = 20;

/**
 * v2.5.6 Daniel Jiménez
 * We cannot use `withFileTypes` because it treats everything as a symbolic link,
 * so we have to use `stat` for each entry.
 */
export async function statReaddir({ folder, concurrency = DEFAULT_STAT_READDIR_CONCURRENCY, onError }: Props) {
  const files: StatItem[] = [];
  const folders: StatItem[] = [];
  const entries = await readdir(folder);
  let nextEntryIndex = 0;

  async function processNextEntry() {
    while (nextEntryIndex < entries.length) {
      const entry = entries[nextEntryIndex];
      nextEntryIndex += 1;

      const path = join(folder, entry);
      const { data: stats, error } = await fileSystem.stat({ absolutePath: path });

      if (error) {
        onError?.({ path, error });
      } else if (stats.isFile()) {
        files.push({ path, stats });
      } else if (stats.isDirectory()) {
        folders.push({ path, stats });
      }
    }
  }

  const workerCount = getWorkerCount({ concurrency, itemCount: entries.length });
  await Promise.all(Array.from({ length: workerCount }, processNextEntry));

  return { files, folders };
}
