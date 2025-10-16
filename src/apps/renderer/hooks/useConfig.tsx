import { useEffect, useState } from 'react';

import { StoredValues } from '../../main/config/service';
import { Theme } from '@/apps/shared/types/Theme';

export function useConfig(key: StoredValues) {
  const [value, setValue] = useState<StoredValues | undefined>(undefined);

  const retriveValue = (key: StoredValues) => {
    return window.electron.getConfigKey(key);
  };

  useEffect(() => {
    void retriveValue(key).then(setValue);
  }, []);

  return value;
}

function useReactiveConfig<T>(key: StoredValues) {
  const [value, setValue] = useState<T | undefined>(undefined);

  const retrieveValue = (key: StoredValues) => {
    return window.electron.getConfigKey(key);
  };

  useEffect(() => {
    retrieveValue(key).then(setValue);
    const subscription = window.electron.listenToConfigKeyChange<T>(key, (newValue) => {
      setValue(newValue);
    });
    return subscription;
  }, [key]);

  return value;
}

export function useTheme() {
  const preferredTheme = useReactiveConfig<Theme>('preferedTheme');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const getInitialSystemTheme = async () => {
      if (preferredTheme === 'system') {
        const theme = await window.electron.getSystemTheme();
        setSystemTheme(theme);
      }
    };

    void getInitialSystemTheme();

    const subscription = window.electron.listenToSystemThemeChange((newSystemTheme) => {
      setSystemTheme(newSystemTheme);
    });

    return subscription;
  }, [preferredTheme]);

  if (preferredTheme === 'system') {
    return systemTheme;
  }

  return preferredTheme ?? 'dark';
}
