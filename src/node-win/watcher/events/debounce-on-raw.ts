import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { onChange } from './on-change';
import { Stats } from 'node:fs';

export const timeouts = new Map<AbsolutePath, NodeJS.Timeout>();

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  stats: Stats;
};

export function debounceOnRaw({ ctx, path, stats }: TProps) {
  let timeout = timeouts.get(path);

  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(async () => {
    timeouts.delete(path);
    await onChange({ ctx, path, stats });
  }, 2000);

  timeouts.set(path, timeout);
}
