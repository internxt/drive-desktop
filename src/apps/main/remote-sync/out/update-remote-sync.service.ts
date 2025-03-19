import { logger } from '@/apps/shared/logger/logger';
import { startRemoteSync } from './start-remote-sync.service';
import { updateSyncEngine } from '../../background-processes/sync-engine';
import { checkSyncEngineInProcess } from './check-sync-engine-in-process.service';
import { remoteSyncManagers } from '../store';

export async function updateRemoteSync(): Promise<void> {
  remoteSyncManagers.forEach(async (manager, workspaceId) => {
    await startRemoteSync(undefined, workspaceId);
    const isSyncing = checkSyncEngineInProcess(5000, workspaceId);
    logger.debug({ msg: 'Is syncing', isSyncing });
    if (isSyncing) {
      logger.debug({ msg: 'Remote sync is already running' });
      return;
    }
    updateSyncEngine(workspaceId);
  });
}
