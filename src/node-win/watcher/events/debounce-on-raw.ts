import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Watcher } from '../watcher';
import { onRaw } from './on-raw.service';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

export const timeouts = new Map<string, NodeJS.Timeout>();

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  event: string;
  absolutePath: AbsolutePath;
  details: unknown;
};

export function debounceOnRaw(props: TProps) {
  const key = `${props.event}:${props.absolutePath}`;

  const currTimeout = timeouts.get(key);

  if (currTimeout) {
    clearTimeout(currTimeout);
  }

  const timeout = setTimeout(() => {
    void onRaw(props);
    timeouts.delete(key);
  }, 2000);

  timeouts.set(key, timeout);
}
