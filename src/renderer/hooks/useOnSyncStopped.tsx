import { useEffect } from 'react';
import useSyncStopped from './useSyncStopped';

export function useOnSyncStopped(onStop: () => void) {
  const [syncStopped] = useSyncStopped();

  useEffect(() => {
    if (syncStopped) {
      onStop();
    }
  }, [syncStopped]);
}
