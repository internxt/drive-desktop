import { ipcMain } from 'electron';

import { calculateUsage } from './service';

ipcMain.handle('get-usage', calculateUsage);
