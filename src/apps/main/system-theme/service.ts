import { nativeTheme } from 'electron';
import { broadcastToWindows } from '../windows';

export function getSystemTheme(): Promise<'light' | 'dark'> {
  return Promise.resolve(nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
}

export function setupSystemThemeListener() {
  nativeTheme.on('updated', async () => {
    const systemTheme = await getSystemTheme();
    broadcastToWindows({ name: 'system-theme-updated', data: systemTheme });
  });
}
