import { logger } from '@/apps/shared/logger/logger';
import { getRemoteSyncManager, remoteSyncManagers } from '../store';
import { startRemoteSync } from './start-remote-sync';
import { updateSyncEngine } from '../../background-processes/sync-engine';

async function updateRemoteSync({ workspaceId }: { workspaceId: string }) {
  const manager = getRemoteSyncManager({ workspaceId });

  if (!manager) return;

  // TODO: let's create a use case if the syncing is blocked for 5 minutes
  if (manager.status === 'SYNCING') {
    logger.debug({ msg: 'Remote sync is already running', workspaceId });
    return;
  }

  manager.changeStatus('SYNCING');
  await startRemoteSync({ workspaceId });
  updateSyncEngine(workspaceId);
}

export async function updateAllRemoteSync() {
  await Promise.all(
    Object.entries(remoteSyncManagers).map(async ([workspaceId]) => {
      await updateRemoteSync({ workspaceId });
    }),
  );
}
