import { useEffect, useState } from 'react';
import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';

export default function useSyncStatus(onChange?: (curentState: RemoteSyncStatus) => void) {
  const [syncStatus, setSyncStatus] = useState<RemoteSyncStatus>('SYNCING');

  useEffect(() => {
    void window.electron.getRemoteSyncStatus().then((status) => {
      setSyncStatus(status);
    });

    const removeListener = window.electron.onRemoteSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    return removeListener;
  }, []);

  useEffect(() => {
    if (onChange) onChange(syncStatus);
  }, [syncStatus]);

  return { syncStatus };
}
