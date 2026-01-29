import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { onChange } from './on-change';

export const timeouts = new Map<AbsolutePath, NodeJS.Timeout>();

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export function debounceOnRaw({ ctx, path }: TProps) {
  let timeout = timeouts.get(path);

  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(async () => {
    timeouts.delete(path);
    await onChange({ ctx, path });
  }, 2000);

  timeouts.set(path, timeout);
}
