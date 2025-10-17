import { useEffect, useState } from 'react';

import { DEFAULT_THEME, ThemeData } from '@/apps/shared/types/Theme';

export function useTheme() {
  const [value, setValue] = useState<ThemeData>({ configTheme: DEFAULT_THEME, theme: DEFAULT_THEME });

  function updateTheme() {
    void window.electron.getTheme().then(setValue);
    return window.electron.listenToConfigKeyChange<ThemeData>('preferedTheme', setValue);
  }

  useEffect(() => updateTheme(), []);

  return value;
}
