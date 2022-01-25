import { BrowserWindow, ipcMain, shell } from 'electron';
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

  // Open urls in the user's browser
  syncIssuesWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  syncIssuesWindow.webContents.on('ipc-message', (_, channel) => {
    if (channel === 'user-closed-window') syncIssuesWindow?.close();
  });
}
