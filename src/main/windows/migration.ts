import { BrowserWindow, ipcMain } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';

let migrationWindow: BrowserWindow | null = null;
export const getMigrationWindow = () => migrationWindow;

export const openMigrationWindow = () => {
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
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
    frame: process.platform !== 'darwin' ? false : undefined,
    resizable: false,
    maximizable: false,
  });

  migrationWindow.loadURL(resolveHtmlPath('migration'));

  migrationWindow.on('ready-to-show', () => {
    migrationWindow?.show();
  });

  setUpCommonWindowHandlers(migrationWindow);
};

ipcMain.on('open-migration-window', () => openMigrationWindow());
