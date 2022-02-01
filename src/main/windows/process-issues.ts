import { BrowserWindow, ipcMain } from 'electron';
import { setUpCommonWindowHandlers } from '.';
import { preloadPath, resolveHtmlPath } from '../util';

let processIssuesWindow: BrowserWindow | null = null;
export const getProcessIssuesWindow = () => processIssuesWindow;

ipcMain.on('open-process-issues-window', openProcessIssuesWindow);

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
