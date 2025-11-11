import { nativeTheme } from 'electron';
import { broadcastToWindows } from '../windows';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Theme } from './theme.types';
import { electronStore } from '../config';

export function getTheme() {
  const configTheme = electronStore.get('preferedTheme');
  let theme: Theme;

  nativeTheme.themeSource = configTheme;

  if (configTheme === 'system') {
    theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  } else {
    theme = configTheme;
  }

  return { configTheme, theme };
}

export function broadcastTheme() {
  broadcastToWindows({ name: 'preferedTheme-updated', data: getTheme() });
}

export function setupThemeListener() {
  nativeTheme.on('updated', () => {
    logger.debug({ msg: 'System theme changed' });
    broadcastTheme();
  });
}
