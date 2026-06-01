import { ipcMain } from 'electron';

import { desktopEntryIsPresent, toggleDesktopEntry } from './service';

ipcMain.handle('is-auto-launch-enabled', desktopEntryIsPresent);

ipcMain.handle('toggle-auto-launch', toggleDesktopEntry);
