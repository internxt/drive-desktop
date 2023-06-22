import { useEffect } from 'react';

import { SyncStatus } from '../../main/background-processes/sync';

export default function useSyncStatus(
  onSyncStatusChanged: (value: SyncStatus) => void
) {
  useEffect(() => {
    window.electron.getRemoteSyncStatus().then((status) => {
      if (status === 'SYNCING') {
        onSyncStatusChanged('RUNNING');
      }

      if (status === 'IDLE' || status === 'SYNCED') {
        onSyncStatusChanged('STANDBY');
      }

      if (status === 'SYNC_FAILED') {
        onSyncStatusChanged('FAILED');
      }
    });

    const removeListener = window.electron.onRemoteSyncStatusChange(
      (newStatus) => {
        if (newStatus === 'SYNCING') {
          onSyncStatusChanged('RUNNING');
        }

        if (newStatus === 'IDLE' || newStatus === 'SYNCED') {
          onSyncStatusChanged('STANDBY');
        }

        if (newStatus === 'SYNC_FAILED') {
          onSyncStatusChanged('FAILED');
        }
      }
    );

    return removeListener;
  }, []);
}
