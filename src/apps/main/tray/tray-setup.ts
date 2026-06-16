import { app } from 'electron';
import path from 'node:path';
import { TrayMenu } from './tray-menu';
import { getOrCreateWidged, setBoundsOfWidgetByPath, toggleWidgetVisibility } from '../windows/widget';
import { getIsLoggedIn } from '../auth/handlers';
import { getAuthWindow } from '../windows/auth';
import { TrayMenuState } from './types';
import { PATHS } from '../../../core/electron/paths';
import { onMainI18nLanguageChange } from '../localize/i18n.service';

let tray: TrayMenu | null = null;
let removeMainI18nListener: (() => void) | null = null;

// v.2.6.0
// Esteban Galvis Triana
// Tracks the number of concurrent sync operations in progress.
// The tray only transitions to IDLE when this counter reaches zero, preventing
// rapid icon flickering when many files are synced concurrently.
let activeSyncCount = 0;

export function getTray() {
  return tray;
}

export function setTrayStatus(status: Exclude<TrayMenuState, 'LOADING'>) {
  if (status === 'SYNCING') {
    activeSyncCount++;
    tray?.setState('SYNCING');
  } else if (status === 'IDLE') {
    activeSyncCount = Math.max(0, activeSyncCount - 1);
    if (activeSyncCount === 0) tray?.setState('IDLE');
  } else if (status === 'ALERT') {
    activeSyncCount = Math.max(0, activeSyncCount - 1);
    tray?.setState('ALERT');
  }
}

export function resetTrayStatus(status: TrayMenuState) {
  activeSyncCount = 0;
  tray?.setState(status);
}

async function onTrayClick() {
  const isLoggedIn = getIsLoggedIn();
  if (!isLoggedIn) {
    getAuthWindow()?.show();
    return;
  }

  const widgetWindow = await getOrCreateWidged();
  if (tray && widgetWindow) {
    setBoundsOfWidgetByPath(widgetWindow, tray);
  }

  if (widgetWindow) toggleWidgetVisibility();
}

async function onQuitClick() {
  app.quit();
}

export function setupTrayIcon() {
  if (tray) return tray;

  const iconsPath = path.join(PATHS.RESOURCES_PATH, 'tray');

  tray = new TrayMenu(iconsPath, onTrayClick, onQuitClick);

  if (!removeMainI18nListener) {
    removeMainI18nListener = onMainI18nLanguageChange(() => {
      tray?.refreshTranslations();
    });
  }

  return tray;
}
