import { useEffect, useState } from 'react';

import { StoredValues } from '../../main/config/service';
import { DEFAULT_THEME, Theme } from '@/apps/shared/types/Theme';

export function useConfig(key: StoredValues) {
  const [value, setValue] = useState<StoredValues | undefined>(undefined);

  useEffect(() => {
    void window.electron.getConfigKey(key).then(setValue);
  }, []);

  return value;
}

function useReactiveConfig<T>(key: StoredValues, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    void window.electron.getConfigKey(key).then(setValue);
    return window.electron.listenToConfigKeyChange<T>(key, setValue);
  }, [key]);

  return value;
}

export function useTheme() {
  const configTheme = useReactiveConfig<Theme>('preferedTheme', DEFAULT_THEME);
  const [theme, setTheme] = useState<'light' | 'dark'>(DEFAULT_THEME);

  async function updateTheme() {
    if (configTheme === 'system') {
      setTheme(await window.electron.getSystemTheme());
    } else {
      setTheme(configTheme);
    }

    void window.electron.toggleDarkMode(configTheme);
  }

  useEffect(() => void updateTheme(), [configTheme]);

  return { configTheme, theme };
}
