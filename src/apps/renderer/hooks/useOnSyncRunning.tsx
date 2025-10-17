import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';
import useSyncStatus from './useSyncStatus';

export function useOnSyncRunning(fn: () => void) {
  function isRunning(status: RemoteSyncStatus) {
    return status === 'SYNCING';
  }

  useSyncStatus((status) => {
    if (!isRunning(status)) return;

    fn();
  });
}
