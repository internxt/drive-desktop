import { BrowserWindow, ipcMain } from 'electron';
import { setUpCommonWindowHandlers } from '.';
import { preloadPath, resolveHtmlPath } from '../util';
import configStore from '../config';

let onboardingWindow: BrowserWindow | null = null;
export const getOnboardingWindow = () => onboardingWindow;

ipcMain.on('user-logged-in', () => {
  const lastOnboardingShown = configStore.get('lastOnboardingShown');

  if (lastOnboardingShown) return;

  openOnboardingWindow();
});

ipcMain.on('open-onboarding-window', () => openOnboardingWindow());

const openOnboardingWindow = () => {
  if (onboardingWindow) {
    onboardingWindow.focus();
    return;
  }

  onboardingWindow = new BrowserWindow({
    width: 732,
    height: 470,
    show: false,
    webPreferences: {
      preload: preloadPath,
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

  onboardingWindow.on('close', () => {
    configStore.set('lastOnboardingShown', Date.now().toLocaleString());
    onboardingWindow = null;
  });

  setUpCommonWindowHandlers(onboardingWindow);
};
