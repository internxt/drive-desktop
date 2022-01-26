import { BrowserWindow, ipcMain } from 'electron';
import { setUpCommonWindowHandlers } from '.';
import { preloadPath, resolveHtmlPath } from '../util';

let syncIssuesWindow: BrowserWindow | null = null;
export const getSyncIssuesWindow = () => syncIssuesWindow;

ipcMain.on('open-sync-issues-window', openSyncIssuesWindow);

async function openSyncIssuesWindow() {
  if (syncIssuesWindow) {
    syncIssuesWindow.focus();
    return;
  }

  syncIssuesWindow = new BrowserWindow({
    width: 500,
    height: 384,
    show: false,
    webPreferences: {
      preload: preloadPath,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
    frame: process.platform !== 'darwin' ? false : undefined,
    resizable: false,
    maximizable: false,
  });

  syncIssuesWindow.loadURL(resolveHtmlPath('sync-issues'));

  syncIssuesWindow.on('ready-to-show', () => {
    syncIssuesWindow?.show();
  });

  syncIssuesWindow.on('close', () => {
    syncIssuesWindow = null;
  });

  setUpCommonWindowHandlers(syncIssuesWindow);
}
