import { ipcMain } from 'electron';

import { getConfigKey, setConfigKey } from './service';

ipcMain.handle('get-config-key', (_, key) => getConfigKey(key));

ipcMain.on('set-config-key', (_, { key, value }) => {
  setConfigKey(key, value);
});
