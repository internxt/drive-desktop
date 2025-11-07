import { ipcMain, shell } from 'electron';
import path from 'node:path';
import { PATHS } from '../../core/electron/paths';

ipcMain.on('open-logs', () => {
  const logFolderPath = path.dirname(PATHS.LOGS);
  shell.openPath(logFolderPath);
});
