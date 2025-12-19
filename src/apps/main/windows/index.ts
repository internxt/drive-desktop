import { BrowserWindow } from 'electron';

import eventBus from '../event-bus';
import { getOnboardingWindow } from './onboarding';
import { getProcessIssuesWindow } from './process-issues';
import { getSettingsWindow } from './settings';
import { getWidget } from './widget';
import { openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { BroadcastToWidget, BroadcastToWindows } from './broadcast-to-windows';

export function closeAuxWindows() {
  getWidget()?.destroy();
  getProcessIssuesWindow()?.destroy();
  getSettingsWindow()?.destroy();
  getOnboardingWindow()?.destroy();
}

export function broadcastToWidget({ name, data }: BroadcastToWidget) {
  getWidget()?.webContents.send(name, data);
}

export function broadcastToWindows({ name, data }: BroadcastToWindows) {
  const renderers = [getWidget(), getProcessIssuesWindow(), getSettingsWindow(), getOnboardingWindow()];

  renderers.forEach((r) => r?.webContents.send(name, data));
}

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
