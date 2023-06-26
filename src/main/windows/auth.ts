import { BrowserWindow } from 'electron';

import eventBus from '../event-bus';
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
    height: 474,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
    },
    movable: true,
    frame: false,
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
