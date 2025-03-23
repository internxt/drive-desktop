import { ipcMain } from 'electron';

import { isAutoLaunchEnabled, toggleAutoLaunch } from './service';

export function setupAutoLaunchHandlers() {
  ipcMain.handle('is-auto-launch-enabled', isAutoLaunchEnabled);
  ipcMain.handle('toggle-auto-launch', toggleAutoLaunch);
}
