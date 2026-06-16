import { ipcMain } from 'electron';
import { isLanguage } from '../../shared/Locale/Language';

import { getConfigKey, setConfigKey } from './service';

ipcMain.handle('get-config-key', (_, key) => getConfigKey(key));

ipcMain.on('set-config-key', (_, { key, value }) => {
  setConfigKey({ key, value });
});

ipcMain.on('set-prefered-language', (_, language) => {
  if (!isLanguage(language)) return;

  setConfigKey({ key: 'preferedLanguage', value: language });
});
