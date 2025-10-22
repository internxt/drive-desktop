import { DEFAULT_THEME, ThemeData } from '@/apps/main/config/theme.types';
import { useEffect, useState } from 'react';

export function useTheme() {
  const [value, setValue] = useState<ThemeData>({ configTheme: DEFAULT_THEME, theme: DEFAULT_THEME });

  function updateTheme() {
    void globalThis.window.electron.getTheme().then(setValue);
    return globalThis.window.electron.listenToConfigKeyChange<ThemeData>('preferedTheme', setValue);
  }

  useEffect(() => updateTheme(), []);

  return value;
}
