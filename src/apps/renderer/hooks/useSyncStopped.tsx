import { SyncStoppedPayload } from 'context/desktop/sync/domain/SyncStoppedPayload';
import { useEffect, useState } from 'react';

export default function useSyncStopped(): [
  SyncStoppedPayload | null,
  React.Dispatch<React.SetStateAction<SyncStoppedPayload | null>>
] {
  const [stopReason, setStopReason] = useState<SyncStoppedPayload | null>(null);

  useEffect(() => {
    const removeListener = window.electron.onSyncStopped(setStopReason);

    return removeListener;
  }, []);

  return [stopReason, setStopReason];
}
