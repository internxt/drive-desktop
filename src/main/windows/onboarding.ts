import { BrowserWindow, ipcMain } from 'electron';
import { setUpCommonWindowHandlers } from '.';
import { preloadPath, resolveHtmlPath } from '../util';

let onboardingWindow: BrowserWindow | null = null;

ipcMain.on('open-onboarding-window', (_, userName) =>
  openOnboardingWindow(userName)
);

const openOnboardingWindow = (userName: string) => {
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

  onboardingWindow.loadURL(
    resolveHtmlPath('onboarding', `userName=${userName}`)
  );

  onboardingWindow.on('ready-to-show', () => {
    onboardingWindow?.show();
  });

  onboardingWindow.on('close', () => {
    onboardingWindow = null;
  });

  setUpCommonWindowHandlers(onboardingWindow);
};

// ipcMain.on(
//   'settings-window-resized',
//   (_, { height }: { width: number; height: number }) => {
//     if (onboardingWindow) {
//       // Not truncating the height makes this function throw
//       // in windows
//       onboardingWindow.setBounds({ height: Math.trunc(height) });
//     }
//   }
// );

export const getOnboardingWindow = () => onboardingWindow;
