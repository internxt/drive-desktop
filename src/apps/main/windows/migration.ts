import { BrowserWindow, ipcMain } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';

let migrationWindow: BrowserWindow | null = null;
export const getMigrationWindow = () => (migrationWindow?.isDestroyed() ? null : migrationWindow);

const openMigrationWindow = () => {
  if (migrationWindow) {
    migrationWindow.focus();

    return;
  }

  migrationWindow = new BrowserWindow({
    width: 800,
    height: 470,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
    },
    titleBarStyle: undefined,
    frame: false,
    resizable: false,
    maximizable: false,
  });

  migrationWindow.loadURL(resolveHtmlPath('migration'));

  migrationWindow.on('closed', () => {
    migrationWindow = null;
  });
  migrationWindow.on('ready-to-show', () => {
    migrationWindow?.show();
  });

  setUpCommonWindowHandlers(migrationWindow);
};

ipcMain.handle('open-migration-window', () => {
  openMigrationWindow();
});
