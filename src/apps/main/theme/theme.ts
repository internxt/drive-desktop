import { nativeTheme } from 'electron';
import { broadcastToWindows } from '../windows';
import { getConfigKey } from '../config/service';
import { DEFAULT_THEME, Theme } from '@/apps/shared/types/Theme';

export function getTheme() {
  const configTheme = getConfigKey('preferedTheme') ?? DEFAULT_THEME;
  let theme: Theme;

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
  nativeTheme.on('updated', () => broadcastTheme());
}
