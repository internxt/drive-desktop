import { ENV } from '@/core/env/env';
import { ipcMain, shell } from 'electron';
import log from 'electron-log';
import path from 'path';

log.transports.file.maxSize = 1048576 * 150; // 150MB
log.transports.console.format = '[{iso}] [{level}] {text}';

if (ENV.NODE_ENV !== 'development') {
  log.transports.file.level = 'info';
  log.transports.console.level = 'error';
} else {
  log.transports.file.level = 'silly';
  log.transports.console.level = 'silly';
}

// Handle open logs

ipcMain.on('open-logs', () => {
  const logFilePath = log.transports.file.getFile().path;
  const logFolderPath = path.dirname(logFilePath);
  shell.openPath(logFolderPath);
});
