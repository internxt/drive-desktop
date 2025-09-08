import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ProcessSyncContext } from './config';
import { refreshItemPlaceholders } from './refresh-item-placeholders';

type Props = {
  ctx: ProcessSyncContext;
};

export const store = {
  running: false,
  queued: false,
};

export async function trackRefreshItemPlaceholders({ ctx }: Props) {
  if (store.running) {
    store.queued = true;
    return;
  }

  store.running = true;

  const startTime = performance.now();
  const workspaceId = ctx.workspaceId;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Refreshing item placeholders', workspaceId });

  await refreshItemPlaceholders({ ctx, workspaceId });

  const endTime = performance.now();

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: '[TIME] Finish refreshing item placeholders',
    workspaceId,
    time: `${(endTime - startTime) / 1000}s`,
  });

  store.running = false;

  if (store.queued) {
    store.queued = false;
    void trackRefreshItemPlaceholders({ ctx });
  }
}
