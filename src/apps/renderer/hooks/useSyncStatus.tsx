import { useEffect, useState } from 'react';
import { SyncStatus } from '../../../context/desktop/sync/domain/SyncStatus';
import { RemoteSyncStatus } from '../../main/remote-sync/helpers';

const statusesMap: Record<RemoteSyncStatus, SyncStatus> = {
  SYNCING: 'RUNNING',
  IDLE: 'STANDBY',
  SYNCED: 'STANDBY',
  SYNC_FAILED: 'FAILED',
};

export default function useSyncStatus(
  onChange?: (currentState: SyncStatus) => void
) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('RUNNING');

  const setSyncStatusFromRemote = (remote: RemoteSyncStatus): void => {
    setSyncStatus(statusesMap[remote]);
  };

  useEffect(() => {
    window.electron.getRemoteSyncStatus().then(setSyncStatusFromRemote);

    const removeListener = window.electron.onRemoteSyncStatusChange(
      setSyncStatusFromRemote
    );

    return removeListener;
  }, []);

  useEffect(() => {
    if (onChange) onChange(syncStatus);
  }, [syncStatus]);

  return { syncStatus };
}
