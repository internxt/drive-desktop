import { useEffect, useState } from 'react';
import { SyncStateItem } from '@/backend/features/local-sync/sync-state/defs';

export function useSyncInfoSubscriber() {
  const [processInfoUpdatedPayload, setProcessInfoUpdatedPayload] = useState<SyncStateItem[]>([]);

  useEffect(() => {
    return globalThis.window.electron.onSyncInfoUpdate(setProcessInfoUpdatedPayload);
  }, []);

  return {
    processInfoUpdatedPayload,
  };
}
