import { logger } from '@/apps/shared/logger/logger';
import { setTrayStatus } from '../../tray/tray';
import { broadcastToWindows } from '../../windows';
import { RemoteSyncStatus } from '../helpers';
import { remoteSyncManagers } from '../store';

export function broadcastSyncStatus() {
  const allStatus = [...remoteSyncManagers].map(([, manager]) => manager.status);
  logger.debug({ msg: 'ALL_STATUS', allStatus });

  let status: RemoteSyncStatus = 'IDLE';

  if (allStatus.some((status) => status === 'SYNCING')) {
    status = 'SYNCING';
  } else if (allStatus.some((status) => status === 'SYNC_FAILED')) {
    status = 'SYNC_FAILED';
  } else if (allStatus.every((status) => status === 'SYNCED')) {
    status = 'SYNCED';
  }

  broadcastToWindows('remote-sync-status-change', status);

  switch (status) {
    case 'SYNCING':
      return setTrayStatus('SYNCING');
    case 'SYNC_FAILED':
      return setTrayStatus('ALERT');
    case 'SYNCED':
      return setTrayStatus('IDLE');
  }
}
