import { BrowserWindow } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';
import { getIsLoggedIn } from '../auth/handlers';

let authWindow: BrowserWindow | null = null;
export const getAuthWindow = () => {
  return authWindow?.isDestroyed() ? null : authWindow;
};

export const createAuthWindow = async () => {
  authWindow = new BrowserWindow({
    width: 300,
    height: 450,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
    },
    titleBarStyle: undefined,
    frame: false,
    resizable: false,
    maximizable: false,
    skipTaskbar: true,
  });

  const authLoaded = authWindow.loadURL(resolveHtmlPath('login'));

  authWindow.on('ready-to-show', () => {
    authWindow?.show();
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });

  authWindow.on('blur', () => {
    const isLoggedIn = getIsLoggedIn();

    if (!isLoggedIn) {
      return;
    }

    authWindow?.hide();
  });

  setUpCommonWindowHandlers(authWindow);

  await authLoaded;
};
