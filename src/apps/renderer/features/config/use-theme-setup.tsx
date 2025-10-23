import { useEffect } from 'react';

import { configStore } from './config.store';
import { ThemeData } from '@/apps/main/config/theme.types';

function updateTheme(themeData: ThemeData) {
  configStore.setState(themeData);
}

export function useThemeSetup() {
  useEffect(() => {
    void globalThis.window.electron.getTheme().then(updateTheme);
    return globalThis.window.electron.listenToConfigKeyChange<ThemeData>('preferedTheme', updateTheme);
  }, []);
}
