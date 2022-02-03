import { ipcMain } from 'electron';
import { getOrCreateDevice, renameDevice } from './service';

ipcMain.handle('get-or-create-device', getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => renameDevice(v));
