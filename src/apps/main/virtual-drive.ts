import { ipcMain } from 'electron';
import {
  getFuseDriveState,
  startVirtualDrive,
  stopAndClearFuseApp,
  stopFuse,
  updateFuseApp,
} from '../drive';
import eventBus from './event-bus';

eventBus.on('USER_LOGGED_OUT', stopAndClearFuseApp);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearFuseApp);
eventBus.on('INITIAL_SYNC_READY', startVirtualDrive);
eventBus.on('REMOTE_CHANGES_SYNCHED', updateFuseApp);

ipcMain.handle('get-virtual-drive-status', () => {
  return getFuseDriveState();
});

ipcMain.handle('retry-virtual-drive-mount', async () => {
  stopFuse();
  await startVirtualDrive();
});
