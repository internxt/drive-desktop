import { BrowserWindow, ipcMain } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';
import isDev from '../../../core/isDev/isDev';

let feedbackWindow: BrowserWindow | null = null;
export const getFeedbackWindow = () =>
  feedbackWindow?.isDestroyed() ? null : feedbackWindow;

export const openFeedbackWindow = () => {
  if (feedbackWindow) {
    feedbackWindow.focus();

    return;
  }

  feedbackWindow = new BrowserWindow({
    width: 380,
    height: 352,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      devTools: isDev(),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
    resizable: false,
    maximizable: false,
    frame: false,
    skipTaskbar: true,
  });

  feedbackWindow.loadURL(resolveHtmlPath('feedback'));

  feedbackWindow.on('closed', () => {
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
