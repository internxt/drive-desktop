import { BrowserWindow, shell } from 'electron';
import { getSettingsWindow } from './settings';
import { getSyncIssuesWindow } from './sync-issues';
import { getWidget } from './widget';

export function closeAuxWindows() {
  getSyncIssuesWindow()?.close();
  getSettingsWindow()?.close();
}

export function broadcastToWindows(eventName: string, data: any) {
  const renderers = [getWidget(), getSyncIssuesWindow(), getSettingsWindow()];

  renderers.forEach((r) => r?.webContents.send(eventName, data));
}

export function setUpCommonWindowHandlers(window: BrowserWindow) {
  // Open urls in the user's browser
  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  window.webContents.on('ipc-message', (_, channel) => {
    if (channel === 'user-closed-window') window?.close();
  });
}
