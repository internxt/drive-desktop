import { useEffect, useState } from 'react';
import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';

export default function useSyncStatus(onChange?: (curentState: RemoteSyncStatus) => void) {
  const [syncStatus, setSyncStatus] = useState<RemoteSyncStatus>('SYNCING');

  useEffect(() => {
    void window.electron.getRemoteSyncStatus().then(setSyncStatus);
    return window.electron.onRemoteSyncStatusChange(setSyncStatus);
  }, []);

  useEffect(() => {
    if (onChange) onChange(syncStatus);
  }, [syncStatus]);

  return { syncStatus };
}
