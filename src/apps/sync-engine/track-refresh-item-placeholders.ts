import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { getConfig } from './config';
import { refreshItemPlaceholders } from './refresh-item-placeholders';

type Props = {
  container: DependencyContainer;
};

export const store = {
  running: false,
  queued: false,
};

export async function trackRefreshItemPlaceholders({ container }: Props) {
  if (store.running) {
    store.queued = true;
    return;
  }

  store.running = true;

  const startTime = performance.now();
  const workspaceId = getConfig().workspaceId;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Refreshing item placeholders', workspaceId });

  await refreshItemPlaceholders({ container, workspaceId });

  const endTime = performance.now();

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Finish refreshing item placeholders',
    workspaceId,
    time: `${(endTime - startTime) / 1000}s`,
  });

  store.running = false;

  if (store.queued) {
    store.queued = false;
    void trackRefreshItemPlaceholders({ container });
  }
}
