import { useEffect, useState } from 'react';

import { SyncStatus } from '../../main/background-processes/sync';

export default function useSyncStatus(
  onChange?: (curentState: SyncStatus) => void
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('RUNNING');

  useEffect(() => {
    window.electron.getRemoteSyncStatus().then((status) => {
      if (status === 'SYNCING') {
        setSyncStatus('RUNNING');
      }

      if (status === 'IDLE' || status === 'SYNCED') {
        setSyncStatus('STANDBY');
      }

      if (status === 'SYNC_FAILED') {
        setSyncStatus('FAILED');
      }
    });

    const removeListener = window.electron.onRemoteSyncStatusChange(
      (newStatus) => {
        if (newStatus === 'SYNCING') {
          setSyncStatus('RUNNING');
        }

        if (newStatus === 'IDLE' || newStatus === 'SYNCED') {
          setSyncStatus('STANDBY');
        }

        if (newStatus === 'SYNC_FAILED') {
          setSyncStatus('FAILED');
        }
      }
    );

    return removeListener;
  }, []);

  useEffect(() => {
    if (onChange) onChange(syncStatus);
  }, [syncStatus]);

  return { syncStatus };
}
