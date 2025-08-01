import { useState } from 'react';
import { SyncStoppedPayload } from '../../../context/desktop/sync/domain/SyncStoppedPayload';

export default function useSyncStopped(): [SyncStoppedPayload | null, React.Dispatch<React.SetStateAction<SyncStoppedPayload | null>>] {
  const [stopReason, setStopReason] = useState<SyncStoppedPayload | null>(null);

  return [stopReason, setStopReason];
}
