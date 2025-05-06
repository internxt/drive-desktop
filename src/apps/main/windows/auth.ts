import { BrowserWindow } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';
import { getIsLoggedIn } from '../auth/handlers';
import isDev from '../../../core/isDev/isDev';

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
      devTools: isDev(),
    },
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
    frame: process.platform !== 'darwin' ? false : undefined,
    resizable: false,
    maximizable: false,
    skipTaskbar: true,
  });

  const authLoaded = authWindow.loadURL(resolveHtmlPath(''));

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

export function toggleAuthVisibility() {
  if (!authWindow) {
    return;
  }

  if (authWindow.isVisible()) {
    authWindow.hide();
  } else {
    authWindow.show();
  }
}
