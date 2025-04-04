import { setTrayStatus } from '../../tray/tray';
import { broadcastToWindows } from '../../windows';
import { remoteSyncManagers } from '../store';

export function broadcastStatusChange() {
  const statuses = Array.from(remoteSyncManagers.values()).map((manager) => manager.status);

  if (statuses.includes('SYNC_FAILED')) {
    broadcastToWindows('remote-sync-status-change', 'SYNC_FAILED');
    setTrayStatus('ALERT');
  } else if (statuses.includes('SYNCING')) {
    broadcastToWindows('remote-sync-status-change', 'SYNCING');
    setTrayStatus('SYNCING');
  } else {
    broadcastToWindows('remote-sync-status-change', 'SYNCED');
    setTrayStatus('IDLE');
  }
}
