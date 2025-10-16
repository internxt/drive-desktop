import { useEffect, useState } from 'react';

import { StoredValues } from '../../main/config/service';
import { DEFAULT_THEME, ThemeData } from '@/apps/shared/types/Theme';

export function useConfig(key: StoredValues) {
  const [value, setValue] = useState<StoredValues | undefined>(undefined);

  useEffect(() => {
    void window.electron.getConfigKey(key).then(setValue);
  }, []);

  return value;
}

export function useTheme() {
  const [value, setValue] = useState<ThemeData>({ configTheme: DEFAULT_THEME, theme: DEFAULT_THEME });

  function updateTheme() {
    void window.electron.getTheme().then(setValue);
    return window.electron.listenToConfigKeyChange<ThemeData>('preferedTheme', setValue);
  }

  useEffect(() => updateTheme(), []);

  return value;
}
