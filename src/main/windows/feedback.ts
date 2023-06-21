import { BrowserWindow, ipcMain } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';

let feedbackWindow: BrowserWindow | null = null;
export const getFeedbackWindow = () => feedbackWindow;

export const openFeedbackWindow = () => {
  if (feedbackWindow) {
    feedbackWindow.focus();

    return;
  }

  feedbackWindow = new BrowserWindow({
    width: 380,
    height: 320,
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

  feedbackWindow.loadURL(resolveHtmlPath('feedback'));

  feedbackWindow.on('close', () => {
    feedbackWindow = null;
  });
  feedbackWindow.on('ready-to-show', () => {
    feedbackWindow?.show();
  });

  setUpCommonWindowHandlers(feedbackWindow);
};

ipcMain.handle('open-feedback-window', () => {
  openFeedbackWindow();
});
