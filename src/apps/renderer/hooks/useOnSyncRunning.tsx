import { SyncStatus } from '../../../context/desktop/sync/domain/SyncStatus';
import useSyncStatus from './useSyncStatus';

export function useOnSyncRunning(fn: () => void) {
  function isRunning(status: SyncStatus) {
    return status === 'RUNNING';
  }

  useSyncStatus((status) => {
    if (!isRunning(status)) return;

    fn();
  });
}
