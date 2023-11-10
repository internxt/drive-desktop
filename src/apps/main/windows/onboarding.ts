import { BrowserWindow, ipcMain } from 'electron';

import configStore from '../config';
import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';

let onboardingWindow: BrowserWindow | null = null;
export const getOnboardingWindow = () =>
  onboardingWindow?.isDestroyed() ? null : onboardingWindow;

ipcMain.on('open-onboarding-window', () => openOnboardingWindow());

export const openOnboardingWindow = () => {
  if (onboardingWindow) {
    onboardingWindow.focus();

    return;
  }

  onboardingWindow = new BrowserWindow({
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

  onboardingWindow.loadURL(resolveHtmlPath('onboarding'));

  onboardingWindow.on('ready-to-show', () => {
    onboardingWindow?.show();
  });

  onboardingWindow.on('closed', () => {
    configStore.set('lastOnboardingShown', Date.now().toLocaleString());
    onboardingWindow = null;
  });

  setUpCommonWindowHandlers(onboardingWindow);
};
