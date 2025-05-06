import { BrowserWindow, ipcMain, nativeTheme } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';
import eventBus from '../event-bus';
import { ProgressData } from '../antivirus/ManualSystemScan';
import isDev from '../../../core/isDev/isDev';

let settingsWindow: BrowserWindow | null = null;
export const getSettingsWindow = () =>
  settingsWindow?.isDestroyed() ? null : settingsWindow;

ipcMain.on('open-settings-window', (_, section) => openSettingsWindow(section));

async function openSettingsWindow(section?: string) {
  if (settingsWindow) {
    settingsWindow.focus();

    return;
  }

  function handleScanProgress(progressData: ProgressData) {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('antivirus:scan-progress', progressData);
    }
  }

  eventBus.on('ANTIVIRUS_SCAN_PROGRESS', handleScanProgress);

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 600,
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
  });

  settingsWindow.loadURL(resolveHtmlPath('settings', `section=${section}`));

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    eventBus.off('ANTIVIRUS_SCAN_PROGRESS', handleScanProgress);
  });

  setUpCommonWindowHandlers(settingsWindow);
}

ipcMain.on(
  'settings-window-resized',
  (_, { height }: { width: number; height: number }) => {
    if (settingsWindow) {
      // Not truncating the height makes this function throw
      // in windows
      settingsWindow.setBounds(
        {
          height: Math.trunc(height),
        },
        true
      );
    }
  }
);

ipcMain.handle('dark-mode:light', () => {
  nativeTheme.themeSource = 'light';
});
ipcMain.handle('dark-mode:dark', () => {
  nativeTheme.themeSource = 'dark';
});
ipcMain.handle('dark-mode:system', () => {
  nativeTheme.themeSource = 'system';
});
