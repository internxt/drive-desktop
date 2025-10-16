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

function useReactiveConfig<T>(key: StoredValues, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    void window.electron.getConfigKey(key).then(setValue);
    return window.electron.listenToConfigKeyChange<T>(key, setValue);
  }, [key]);

  return value;
}

export function useTheme() {
  const preferredTheme = useReactiveConfig<Theme>('preferedTheme', 'system');

  useEffect(() => {
    void window.electron.toggleDarkMode(preferredTheme);
  }, [preferredTheme]);

  return preferredTheme;
}
