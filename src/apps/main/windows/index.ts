import { BrowserWindow } from 'electron';

import eventBus from '../event-bus';
import { getOnboardingWindow } from './onboarding';
import { getProcessIssuesWindow } from './process-issues';
import { getSettingsWindow } from './settings';
import { getWidget } from './widget';
import { openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { BroadcastToWindows } from './broadcast-to-windows';

function closeAuxWindows() {
  getProcessIssuesWindow()?.close();
  getSettingsWindow()?.close();
  getOnboardingWindow()?.close();
}

export function broadcastToWindows({ name, data }: BroadcastToWindows) {
  const renderers = [getWidget(), getProcessIssuesWindow(), getSettingsWindow(), getOnboardingWindow()];

  renderers.forEach((r) => r?.webContents.send(name, data));
}

eventBus.on('USER_LOGGED_OUT', closeAuxWindows);
eventBus.on('BROADCAST_TO_WINDOWS', broadcastToWindows);

export function setUpCommonWindowHandlers(window: BrowserWindow) {
  // Open urls in the user's browser
  window.webContents.on('ipc-message', (_, channel) => {
    if (channel === 'user-closed-window') {
      window?.close();
    }
    if (channel === 'user-minimized-window') {
      window?.hide();
    }
    if (channel === 'user-finished-onboarding') {
      window?.close();
      openVirtualDriveRootFolder();
    }
  });
}
