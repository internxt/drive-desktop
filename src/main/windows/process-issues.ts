import { BrowserWindow, ipcMain } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';

let processIssuesWindow: BrowserWindow | null = null;
export const getProcessIssuesWindow = () => processIssuesWindow;

ipcMain.on('open-process-issues-window', openProcessIssuesWindow);
ipcMain.handle('open-process-issues-window', async () => {
  await openProcessIssuesWindow();

  return true;
});

async function openProcessIssuesWindow() {
  if (processIssuesWindow) {
    processIssuesWindow.focus();

    return;
  }

  processIssuesWindow = new BrowserWindow({
    width: 500,
    height: 384,
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

  processIssuesWindow.loadURL(resolveHtmlPath('process-issues'));

  processIssuesWindow.on('ready-to-show', () => {
    processIssuesWindow?.show();
  });

  processIssuesWindow.on('close', () => {
    processIssuesWindow = null;
  });

  setUpCommonWindowHandlers(processIssuesWindow);
}
