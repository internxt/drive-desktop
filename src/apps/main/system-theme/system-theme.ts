import { nativeTheme } from 'electron';
import { broadcastToWindows } from '../windows';
import { getConfigKey } from '../config/service';
import { DEFAULT_THEME, Theme } from '@/apps/shared/types/Theme';

export function getTheme() {
  const configTheme = getConfigKey('preferedTheme') ?? DEFAULT_THEME;
  if (configTheme === 'system') {
    const theme: Theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    return { configTheme, theme };
  } else {
    return { configTheme, theme: configTheme };
  }
}

export function setupThemeListener() {
  nativeTheme.on('updated', () => {
    broadcastToWindows({ name: 'preferedTheme-updated', data: getTheme() });
  });
}
