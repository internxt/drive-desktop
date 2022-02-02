import { ipcMain } from 'electron';
import { getOrCreateDevice } from './service';

ipcMain.handle('get-or-create-device', getOrCreateDevice);
