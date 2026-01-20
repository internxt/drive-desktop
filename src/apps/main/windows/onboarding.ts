import { BrowserWindow } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';

let onboardingWindow: BrowserWindow | null = null;

export function getOnboardingWindow() {
  return onboardingWindow?.isDestroyed() ? null : onboardingWindow;
}

export async function openOnboardingWindow() {
  onboardingWindow = new BrowserWindow({
    width: 800,
    height: 470,
    show: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
    },
    titleBarStyle: undefined,
    frame: false,
    resizable: false,
    maximizable: false,
  });

  await onboardingWindow.loadURL(resolveHtmlPath('onboarding'));
}
