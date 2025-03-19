import { RemoteSyncStatus } from '../helpers';
import { remoteSyncManagers } from '../store';

export function checkSyncEngineInProcess(milliSeconds: number, workspaceId = '') {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) return false;
  const syncingStatus: RemoteSyncStatus = 'SYNCING';
  const isSyncing = manager.getSyncStatus() === syncingStatus;
  const recentlySyncing = manager.recentlyWasSyncing(milliSeconds);
  return isSyncing || recentlySyncing; // syncing or recently was syncing
}
