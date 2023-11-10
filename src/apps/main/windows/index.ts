import { BrowserWindow } from 'electron';

import eventBus from '../event-bus';
import { getOnboardingWindow } from './onboarding';
import { getMigrationWindow } from './migration';
import { getProcessIssuesWindow } from './process-issues';
import { getSettingsWindow } from './settings';
import { getFeedbackWindow } from './feedback';
import { getWidget } from './widget';
import { openVirtualDriveRootFolder } from '../virutal-root-folder/service';

function closeAuxWindows() {
  getProcessIssuesWindow()?.close();
  getSettingsWindow()?.close();
  getOnboardingWindow()?.close();
  getMigrationWindow()?.close();
}

eventBus.on('USER_LOGGED_OUT', closeAuxWindows);
eventBus.on('USER_WAS_UNAUTHORIZED', closeAuxWindows);

export function broadcastToWindows(eventName: string, data: any) {
  const renderers = [
    getWidget(),
    getProcessIssuesWindow(),
    getSettingsWindow(),
    getOnboardingWindow(),
    getMigrationWindow(),
    getFeedbackWindow(),
  ];

  renderers.forEach((r) => r?.webContents.send(eventName, data));
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

    if (channel === 'user-finished-migration') {
      window?.close();
    }
  });
}
