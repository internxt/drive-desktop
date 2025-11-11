import { useEffect, useState } from 'react';
import { RemoteSyncStatus } from '@/apps/main/remote-sync/helpers';

export default function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<RemoteSyncStatus>('SYNCING');

  useEffect(() => {
    void globalThis.window.electron.getRemoteSyncStatus().then(setSyncStatus);
    return globalThis.window.electron.onRemoteSyncStatusChange(setSyncStatus);
  }, []);

  return { syncStatus };
}
