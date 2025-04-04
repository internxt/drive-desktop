import { getRemoteSyncManager } from '../store';

const MILLISECONDS = 5000;

export function checkSyncInProgress({ workspaceId }: { workspaceId: string }) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) throw new Error('RemoteSyncManager not found');

  const isSyncing = manager.getSyncStatus() === 'SYNCING';
  const recentlySyncing = manager.recentlyWasSyncing(MILLISECONDS);
  return isSyncing || recentlySyncing;
}
