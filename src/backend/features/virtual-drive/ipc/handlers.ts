import { ipcMain } from 'electron';
import eventBus from '../../../../apps/main/event-bus';
import {
  getVirtualDriveContainer,
  startVirtualDrive,
  remountVirtualDriveOnRootChange,
} from '../services/drive-folder/virtual-drive.service';
import { updateVirtualDriveContainer } from '../services/update-virtual-drive-container.service';
import { DependencyInjectionUserProvider } from '../../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getVirtualDriveState } from '../services/daemon.service';

function remoteChangesSyncedHandler() {
  const container = getVirtualDriveContainer();
  if (container) {
    updateVirtualDriveContainer({ container, user: DependencyInjectionUserProvider.get() });
  } else {
    logger.warn({ msg: '[FUSE] updateVirtualDriveContainer called before container was initialized' });
  }
}

function syncRootChangedHandler({ oldPath, newPath }: { oldPath: string; newPath: string }) {
  void remountVirtualDriveOnRootChange({ oldPath, newPath });
}

export function registerVirtualDriveHandlers() {
  eventBus.on('INITIAL_SYNC_READY', startVirtualDrive);
  eventBus.on('REMOTE_CHANGES_SYNCHED', remoteChangesSyncedHandler);
  eventBus.on('SYNC_ROOT_CHANGED', syncRootChangedHandler);
  ipcMain.handle('get-virtual-drive-status', getVirtualDriveState);
}
