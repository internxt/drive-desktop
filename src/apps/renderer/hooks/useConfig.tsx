import { useEffect, useState } from 'react';

import { StoredValues } from '../../main/config/service';
import { Theme } from '@/apps/shared/types/Theme';

export default function useConfig(key: StoredValues) {
  const [value, setValue] = useState<StoredValues | undefined>(undefined);

  const retriveValue = async (key: StoredValues) => {
    return window.electron.getConfigKey(key);
  };

  useEffect(() => {
    retriveValue(key).then(setValue);
  }, []);

  return value;
}

export function useTheme() {
  const preferredTheme = useConfig('preferedTheme') as Theme;
  const theme = preferredTheme === 'system' ? 'dark' : preferredTheme;
  return theme;
}
