import { useEffect, useState } from 'react';
import { SyncStateItem } from '@/backend/features/local-sync/sync-state/sync-state.meta';

export function useSyncInfoSubscriber() {
  const [processInfoUpdatedPayload, setProcessInfoUpdatedPayload] = useState<SyncStateItem[]>([]);

  useEffect(() => {
    return window.electron.onSyncInfoUpdate(setProcessInfoUpdatedPayload);
  }, []);

  return {
    processInfoUpdatedPayload,
  };
}
