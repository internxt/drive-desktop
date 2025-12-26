import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { fileSystem } from '../file-system.module';
import { StatError } from './stat';
import { Stats } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';

export type StatItem = { path: AbsolutePath; stats: Stats };
type Props = { folder: AbsolutePath; onError?: ({ path, error }: { path: AbsolutePath; error: StatError }) => void };

/**
 * v2.5.6 Daniel Jiménez
 * We cannot use `withFileTypes` because it treats everything as a symbolic link,
 * so we have to use `stat` for each entry.
 */
export async function statReaddir({ folder, onError }: Props) {
  const files: StatItem[] = [];
  const folders: StatItem[] = [];
  const entries = await readdir(folder);

  const promises = entries.map(async (entry) => {
    const path = join(folder, entry);
    const { data: stats, error } = await fileSystem.stat({ absolutePath: path });

    if (error) {
      onError?.({ path, error });
    } else if (stats.isFile()) {
      files.push({ path, stats });
    } else if (stats.isDirectory()) {
      folders.push({ path, stats });
    }
  });

  await Promise.all(promises);

  return { files, folders };
}
