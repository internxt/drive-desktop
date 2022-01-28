import { ipcMain } from 'electron';
import configStore from '../config';

ipcMain.handle('get-backups-interval', () => {
  return configStore.get('backupInterval');
});

ipcMain.handle('set-backups-interval', (_, newValue: number) => {
  return configStore.set('backupInterval', newValue);
});
