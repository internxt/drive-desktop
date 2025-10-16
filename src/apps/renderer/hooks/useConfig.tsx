import { useEffect, useState } from 'react';

import { StoredValues } from '../../main/config/service';
import { Theme } from '@/apps/shared/types/Theme';

export function useConfig(key: StoredValues) {
  const [value, setValue] = useState<StoredValues | undefined>(undefined);

  useEffect(() => {
    void window.electron.getConfigKey(key).then(setValue);
  }, []);

  return value;
}

function useReactiveConfig<T>(key: StoredValues) {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    void window.electron.getConfigKey(key).then(setValue);
    return window.electron.listenToConfigKeyChange<T>(key, setValue);
  }, [key]);

  return value;
}

export function useTheme() {
  const preferredTheme = useReactiveConfig<Theme>('preferedTheme');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  async function getInitialSystemTheme() {
    if (preferredTheme === 'system') {
      const theme = await window.electron.getSystemTheme();
      setSystemTheme(theme);
    }
  }

  useEffect(() => {
    void getInitialSystemTheme();
  }, [preferredTheme]);

  return systemTheme;
}
