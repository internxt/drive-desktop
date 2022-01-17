import { useEffect } from 'react';
import { SyncStatus } from '../../main/main';

export default function useSyncStatus(
  onSyncStatusChanged: (value: SyncStatus) => void
) {
  useEffect(() => {
    window.electron.getSyncStatus().then(onSyncStatusChanged);

    const removeListener =
      window.electron.onSyncStatusChanged(onSyncStatusChanged);
    return removeListener;
  }, []);
}
