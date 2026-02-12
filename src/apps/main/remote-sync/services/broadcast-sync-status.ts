import { logger } from '@/apps/shared/logger/logger';
import { setTrayStatus } from '../../tray/tray';
import { broadcastToWidget } from '../../windows';
import { RemoteSyncStatus } from '../helpers';
import { workers } from '../store';

export function getSyncStatus() {
  const allStatus = [...workers.values().map(({ ctx }) => ctx.status)];
  logger.debug({ msg: 'RemoteSyncManagers status', allStatus });

  let status: RemoteSyncStatus = 'IDLE';

  if (allStatus.some((status) => status === 'SYNCING')) {
    status = 'SYNCING';
  } else if (allStatus.some((status) => status === 'SYNC_FAILED')) {
    status = 'SYNC_FAILED';
  } else if (allStatus.every((status) => status === 'SYNCED')) {
    status = 'SYNCED';
  }

  return status;
}

export function broadcastSyncStatus() {
  const status = getSyncStatus();

  broadcastToWidget({ name: 'remote-sync-status-change', data: status });

  switch (status) {
    case 'SYNCING':
      return setTrayStatus('SYNCING');
    case 'SYNC_FAILED':
      return setTrayStatus('ALERT');
    case 'SYNCED':
      return setTrayStatus('IDLE');
  }
}
