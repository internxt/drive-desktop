import { nativeTheme } from 'electron';
import { broadcastToWindows } from '../windows';
import { getConfigKey } from '../config/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DEFAULT_THEME, Theme } from './theme.types';

export function getTheme() {
  const configTheme = getConfigKey('preferedTheme') || DEFAULT_THEME;
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
