import { nativeTheme } from 'electron';

export function getSystemTheme(): Promise<'light' | 'dark'> {
  return Promise.resolve(nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
}
