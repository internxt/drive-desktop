import { ipcMain } from 'electron';

ipcMain.handle('get-platform', () => {
	return process.platform;
});
