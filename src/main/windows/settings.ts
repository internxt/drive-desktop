import { BrowserWindow, ipcMain, shell } from 'electron';
import { preloadPath, resolveHtmlPath } from '../util';

let settingsWindow: BrowserWindow | null = null;
export const getSettingsWindow = () => settingsWindow;

ipcMain.on('open-settings-window', openSettingsWindow);

async function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 428,
    show: false,
    webPreferences: {
      preload: preloadPath,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
    frame: process.platform !== 'darwin' ? false : undefined,
    resizable: false,
    maximizable: false,
  });

  settingsWindow.loadURL(resolveHtmlPath('settings'));

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show();
  });

  settingsWindow.on('close', () => {
    settingsWindow = null;
  });

  // Open urls in the user's browser
  settingsWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  settingsWindow.webContents.on('ipc-message', (_, channel) => {
    if (channel === 'user-closed-window') settingsWindow?.close();
  });
}

ipcMain.on(
  'settings-window-resized',
  (_, { height }: { width: number; height: number }) => {
    if (settingsWindow) {
      // Not truncating the height makes this function throw
      // in windows
      settingsWindow.setBounds({ height: Math.trunc(height) });
    }
  }
);
