import { ipcMain } from 'electron';
import { isAutoLaunchEnabled, toggleAutoLaunch } from './service';

ipcMain.handle('is-auto-launch-enabled', isAutoLaunchEnabled);

ipcMain.handle('toggle-auto-launch', toggleAutoLaunch);
