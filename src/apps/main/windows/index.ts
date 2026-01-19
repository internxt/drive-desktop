import { BrowserWindow } from 'electron';

import { getOnboardingWindow } from './onboarding';
import { getWidget } from './widget';
import { openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { BroadcastToWidget, BroadcastToWindows } from './broadcast-to-windows';

export function closeAuxWindows() {
  getWidget()?.destroy();
  getOnboardingWindow()?.destroy();
}

export function broadcastToWidget({ name, data }: BroadcastToWidget) {
  getWidget()?.webContents.send(name, data);
}

export function broadcastToWindows({ name, data }: BroadcastToWindows) {
  const renderers = [getWidget(), getOnboardingWindow()];

  renderers.forEach((r) => r?.webContents.send(name, data));
}

export function setUpCommonWindowHandlers(window: BrowserWindow) {
  // Open urls in the user's browser
  window.webContents.on('ipc-message', (_, channel) => {
    if (channel === 'user-closed-window') {
      window?.close();
    }
    if (channel === 'user-finished-onboarding') {
      window?.close();
      openVirtualDriveRootFolder();
    }
  });
}
