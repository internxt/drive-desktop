import { ipcMain } from 'electron';
import { calculateUsage } from './service';

export function registerUsageHandlers() {
  ipcMain.handle('get-usage', () => {
    return calculateUsage();
  });
}
