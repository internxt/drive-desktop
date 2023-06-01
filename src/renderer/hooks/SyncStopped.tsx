import { useEffect, useState } from 'react';

import { SyncStoppedPayload } from '../../main/background-processes/sync';

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
