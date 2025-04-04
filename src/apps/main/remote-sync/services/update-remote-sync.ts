import { logger } from '@/apps/shared/logger/logger';
import { getRemoteSyncManager, remoteSyncManagers } from '../store';
import { startRemoteSync } from './start-remote-sync';
import { updateSyncEngine } from '../../background-processes/sync-engine';
import lodashDebounce from 'lodash.debounce';
import { checkSyncInProgress } from './check-sync-in-progress';

type TProps = {
  workspaceId: string;
};

async function updateRemoteSync({ workspaceId }: TProps) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) return;

  const isSyncing = checkSyncInProgress({ workspaceId });
  if (isSyncing) return;

  if (isSyncing) {
    logger.debug({ msg: 'Remote sync is already running', workspaceId });
    return;
  }

  manager.changeStatus('SYNCING');
  await startRemoteSync({ workspaceId });
  updateSyncEngine(workspaceId);
}

async function updateAllRemoteSync() {
  await Promise.all(
    Object.entries(remoteSyncManagers).map(async ([workspaceId]) => {
      await updateRemoteSync({ workspaceId });
    }),
  );
}

export const debouncedSynchronization = lodashDebounce(updateAllRemoteSync, 1000);
